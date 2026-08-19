import { Part, WrapperType } from '../types';

export const parseFilename = (filename: string): { parts: Part[]; extension: string } => {
  let basename = filename;
  let extension = '';
  
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex > 0 && lastDotIndex > filename.lastIndexOf('/')) {
    basename = filename.substring(0, lastDotIndex);
    extension = filename.substring(lastDotIndex);
  }

  // ファイル名をパーツに分解する正規表現。`[]`、`()`、その他の文字列の順で優先的にマッチさせます。
  const regex = /\[.*?\]|\(.*?\)|[^()[\]\s]+/g;
  const matches = basename.match(regex) || [];
  
  const parts: Part[] = matches.map((match, index) => {
    let content = match;
    let wrapper = WrapperType.NONE;

    // `[]` のチェックを先に行うように順序を変更
    if (match.startsWith('[') && match.endsWith(']')) {
      wrapper = WrapperType.BRACKETS;
      content = match.substring(1, match.length - 1);
    } else if (match.startsWith('(') && match.endsWith(')')) {
      wrapper = WrapperType.PARENS;
      content = match.substring(1, match.length - 1);
    }

    return {
      id: `part-${index}-${Date.now()}`,
      originalIndex: index,
      originalValue: match,
      content,
      originalWrapper: wrapper,
      currentWrapper: wrapper,
    };
  });

  return { parts, extension };
};

const getWrapperChars = (wrapper: WrapperType): [string, string] => {
  switch (wrapper) {
    case WrapperType.PARENS:
      return ['(', ')'];
    case WrapperType.BRACKETS:
      return ['[', ']'];
    default:
      return ['', ''];
  }
};


export const generateRegexAndPreview = (
  originalParts: Part[],
  arrangedParts: Part[],
  extension: string
): { findRegex: string; replaceRegex: string; preview: string } => {

  const findRegex = '^' + originalParts.map(part => {
    switch (part.originalWrapper) {
      case WrapperType.PARENS:
        return '\\((.*?)\\)';
      case WrapperType.BRACKETS:
        return '\\[(.*?)\\]';
      default:
        // WrapperType.NONE の場合の正規表現を、解析ロジックと整合性を取るように変更。
        return '([^()[\\]\\s]+)';
    }
    // パーツ間の区切り文字を `\s+` (1つ以上のスペース) から `\s*` (0個以上のスペース) に変更。
    // これにより、スペースで区切られていないファイル名にも対応。
  }).join('\\s*') + `(${extension.replace('.', '\\.')})` + '$';

  const replaceRegex = arrangedParts.map(part => {
    const [start, end] = getWrapperChars(part.currentWrapper);
    const backreference = `$${part.originalIndex + 1}`;
    return `${start}${backreference}${end}`;
    // 置換後のパーツ間の区切り文字は半角スペース1つに統一。
  }).join(' ') + `$${originalParts.length + 1}`;

  const preview = arrangedParts.map(part => {
      const [start, end] = getWrapperChars(part.currentWrapper);
      return `${start}${part.content}${end}`;
    }).join(' ') + extension;

  return { findRegex, replaceRegex, preview };
};