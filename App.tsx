import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Part, WrapperType } from './types';
import { parseFilename, generateRegexAndPreview } from './services/filenameProcessor';
import { ArrangementArea } from './components/ArrangementArea';
import { CopyIcon, ResetIcon, LightBulbIcon, SunIcon, MoonIcon } from './components/icons';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const storedPrefs = window.localStorage.getItem('theme');
    if (storedPrefs) return storedPrefs;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
};

const placeholderValue = '(100) [あいうえお] ABCDE (@@).txt';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [originalParts, setOriginalParts] = useState<Part[]>([]);
  const [arrangedParts, setArrangedParts] = useState<Part[]>([]);
  const [extension, setExtension] = useState('');
  const [isParsed, setIsParsed] = useState(false);

  const handleParse = useCallback(() => {
    const valueToParse = inputValue.trim() || placeholderValue;
    if (!valueToParse) return;
    const { parts, extension: ext } = parseFilename(valueToParse);
    setOriginalParts(parts);
    setArrangedParts(parts);
    setExtension(ext);
    setIsParsed(true);
    setInputValue(valueToParse);
  }, [inputValue]);

  const handleReset = useCallback(() => {
    setInputValue('');
    setOriginalParts([]);
    setArrangedParts([]);
    setExtension('');
    setIsParsed(false);
  }, []);
  
  const updatePartWrapper = useCallback((partId: string, newWrapper: WrapperType) => {
    setArrangedParts(prevParts =>
      prevParts.map(p =>
        p.id === partId ? { ...p, currentWrapper: newWrapper } : p
      )
    );
  }, []);

  const { findRegex, replaceRegex, preview } = useMemo(() => {
    if (!isParsed) return { findRegex: '', replaceRegex: '', preview: '' };
    return generateRegexAndPreview(originalParts, arrangedParts, extension);
  }, [originalParts, arrangedParts, extension, isParsed]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(err => console.error("Failed to copy:", err));
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl min-h-screen">
      <header className="text-center mb-8 relative">
        <div className="absolute top-0 right-0 z-10">
          <ThemeToggle />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-700 dark:text-slate-100">ファイル名配置換え & 正規表現ジェネレーター</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">ファイル名の一部をドラッグ＆ドロップで並べ替え、一括置換用の正規表現を生成します。</p>
      </header>

      <main className="space-y-6">
        {/* Step 1: Input */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-slate-600 dark:text-slate-300">ステップ1: ファイル名を入力</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholderValue}
              className="flex-grow w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:bg-slate-200 dark:disabled:bg-slate-700"
              disabled={isParsed}
            />
            {!isParsed ? (
              <button
                onClick={handleParse}
                className="w-full sm:w-auto bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow"
              >
                解析する
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="w-full sm:w-auto bg-red-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-600 transition-colors shadow flex items-center justify-center gap-2"
              >
                <ResetIcon />
                リセット
              </button>
            )}
          </div>
        </div>

        {isParsed && (
          <>
            {/* Step 2: Arrange */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-1 text-slate-600 dark:text-slate-300">ステップ2: ドラッグ＆ドロップで配置換え</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">各パーツをクリックすると、囲み文字（() や []）を変更できます。</p>
              <ArrangementArea
                parts={arrangedParts}
                setParts={setArrangedParts}
                updatePartWrapper={updatePartWrapper}
                extension={extension}
              />
            </div>
            
            {/* Preview */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-slate-600 dark:text-slate-300">変換後プレビュー</h2>
              <div className="relative">
                <div className="bg-slate-100 dark:bg-slate-700 p-4 pr-14 rounded-lg text-slate-700 dark:text-slate-300 font-mono text-lg break-all min-h-[56px] flex items-center">
                  <span>{preview}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(preview)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  aria-label="プレビューをコピー"
                >
                  <CopyIcon />
                </button>
              </div>
            </div>

            {/* Step 3: Output */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-slate-600 dark:text-slate-300">ステップ3: 生成された正規表現</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">検索文字列 (Find)</label>
                        <div className="relative">
                            <input type="text" readOnly value={findRegex} className="w-full bg-slate-100 dark:bg-slate-700 p-3 pr-10 rounded-lg font-mono text-sm border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100" />
                            <button onClick={() => copyToClipboard(findRegex)} className="absolute inset-y-0 right-0 px-3 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                                <CopyIcon />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">置換文字列 (Replace)</label>
                        <div className="relative">
                            <input type="text" readOnly value={replaceRegex} className="w-full bg-slate-100 dark:bg-slate-700 p-3 pr-10 rounded-lg font-mono text-sm border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100" />
                            <button onClick={() => copyToClipboard(replaceRegex)} className="absolute inset-y-0 right-0 px-3 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                                <CopyIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </>
        )}

        {!isParsed && (
          <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg">
            <div className="text-blue-500 dark:text-blue-400 mt-1">
              <LightBulbIcon />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">使い方</h3>
              <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 text-sm space-y-1 mt-1">
                <li>上の入力欄に、パターンとなるファイル名を貼り付けます。</li>
                <li>「解析する」ボタンを押すと、ファイル名がパーツに分解されます。</li>
                <li>パーツをドラッグして好きな順序に並べ替えます。</li>
                <li>パーツをクリックして囲み文字を変更できます。</li>
                <li>生成された正規表現をリネームツール等にコピーして使用します。</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;