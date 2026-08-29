import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) {
    return <span className="italic text-slate-400">No description provided for this item.</span>;
  }

  // Detect if the string has standard HTML tags (p, br, strong, em, u, h1, h2, ul, ol, li, a, span, etc.)
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);
  if (hasHtml) {
    return (
      <div 
        className="rich-text-content text-slate-600 font-sans"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Split content by newlines
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const renderInline = (text: string): React.ReactNode[] => {
    // We want to handle:
    // 1. [text](url) (link)
    // 2. **text** (bold)
    // 3. *text* (italic)
    // 4. <u>text</u> (underline)
    
    let parts: { type: 'text' | 'bold' | 'italic' | 'underline' | 'link'; text: string; url?: string }[] = [
      { type: 'text', text }
    ];

    // 1. Parse Links first: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let tempParts: typeof parts = [];
    for (const part of parts) {
      if (part.type !== 'text') {
        tempParts.push(part);
        continue;
      }
      let lastIndex = 0;
      let match;
      linkRegex.lastIndex = 0;
      while ((match = linkRegex.exec(part.text)) !== null) {
        const matchIndex = match.index;
        if (matchIndex > lastIndex) {
          tempParts.push({ type: 'text', text: part.text.substring(lastIndex, matchIndex) });
        }
        tempParts.push({ type: 'link', text: match[1], url: match[2] });
        lastIndex = linkRegex.lastIndex;
      }
      if (lastIndex < part.text.length) {
        tempParts.push({ type: 'text', text: part.text.substring(lastIndex) });
      }
    }
    parts = tempParts;

    // 2. Parse Bold: **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    tempParts = [];
    for (const part of parts) {
      if (part.type !== 'text') {
        tempParts.push(part);
        continue;
      }
      let lastIndex = 0;
      let match;
      boldRegex.lastIndex = 0;
      while ((match = boldRegex.exec(part.text)) !== null) {
        const matchIndex = match.index;
        if (matchIndex > lastIndex) {
          tempParts.push({ type: 'text', text: part.text.substring(lastIndex, matchIndex) });
        }
        tempParts.push({ type: 'bold', text: match[1] });
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < part.text.length) {
        tempParts.push({ type: 'text', text: part.text.substring(lastIndex) });
      }
    }
    parts = tempParts;

    // 3. Parse Italic: *text*
    const italicRegex = /\*([^*]+)\*/g;
    tempParts = [];
    for (const part of parts) {
      if (part.type !== 'text') {
        tempParts.push(part);
        continue;
      }
      let lastIndex = 0;
      let match;
      italicRegex.lastIndex = 0;
      while ((match = italicRegex.exec(part.text)) !== null) {
        const matchIndex = match.index;
        if (matchIndex > lastIndex) {
          tempParts.push({ type: 'text', text: part.text.substring(lastIndex, matchIndex) });
        }
        tempParts.push({ type: 'italic', text: match[1] });
        lastIndex = italicRegex.lastIndex;
      }
      if (lastIndex < part.text.length) {
        tempParts.push({ type: 'text', text: part.text.substring(lastIndex) });
      }
    }
    parts = tempParts;

    // 4. Parse Underline: <u>text</u>
    const underlineRegex = /<u>([^<]+)<\/u>/gi;
    tempParts = [];
    for (const part of parts) {
      if (part.type !== 'text') {
        tempParts.push(part);
        continue;
      }
      let lastIndex = 0;
      let match;
      underlineRegex.lastIndex = 0;
      while ((match = underlineRegex.exec(part.text)) !== null) {
        const matchIndex = match.index;
        if (matchIndex > lastIndex) {
          tempParts.push({ type: 'text', text: part.text.substring(lastIndex, matchIndex) });
        }
        tempParts.push({ type: 'underline', text: match[1] });
        lastIndex = underlineRegex.lastIndex;
      }
      if (lastIndex < part.text.length) {
        tempParts.push({ type: 'text', text: part.text.substring(lastIndex) });
      }
    }
    parts = tempParts;

    return parts.map((part, index) => {
      switch (part.type) {
        case 'bold':
          return <strong key={index} className="font-bold text-slate-800">{part.text}</strong>;
        case 'italic':
          return <em key={index} className="italic">{part.text}</em>;
        case 'underline':
          return <u key={index} className="underline">{part.text}</u>;
        case 'link':
          return (
            <a 
              key={index} 
              href={part.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:text-blue-800 underline font-semibold inline-flex items-center gap-0.5"
            >
              {part.text}
            </a>
          );
        default:
          return <React.Fragment key={index}>{part.text}</React.Fragment>;
      }
    });
  };

  const flushList = (key: number) => {
    if (!currentList) return null;
    const ListTag = currentList.type;
    const listClass = currentList.type === 'ul' 
      ? 'list-disc pl-5 my-1.5 space-y-1' 
      : 'list-decimal pl-5 my-1.5 space-y-1';
    const listNode = (
      <ListTag key={`list-${key}`} className={`${listClass} text-slate-600 font-medium`}>
        {currentList.items.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {renderInline(item)}
          </li>
        ))}
      </ListTag>
    );
    currentList = null;
    return listNode;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check Heading 1
    if (trimmed.startsWith('# ')) {
      if (currentList) {
        const listNode = flushList(i);
        if (listNode) blocks.push(listNode);
      }
      const headingText = trimmed.substring(2);
      blocks.push(
        <h1 key={i} className="text-lg font-bold text-slate-800 mt-3 mb-1.5">
          {renderInline(headingText)}
        </h1>
      );
      continue;
    }

    // Check Heading 2
    if (trimmed.startsWith('## ')) {
      if (currentList) {
        const listNode = flushList(i);
        if (listNode) blocks.push(listNode);
      }
      const headingText = trimmed.substring(3);
      blocks.push(
        <h2 key={i} className="text-base font-bold text-slate-800 mt-2.5 mb-1.5">
          {renderInline(headingText)}
        </h2>
      );
      continue;
    }

    // Check Bullet List Item
    if (trimmed.startsWith('- ')) {
      const itemText = trimmed.substring(2);
      if (currentList && currentList.type !== 'ul') {
        const listNode = flushList(i);
        if (listNode) blocks.push(listNode);
      }
      if (!currentList) {
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(itemText);
      continue;
    }

    // Check Ordered List Item (Match digits followed by dot and space)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      const itemText = olMatch[2];
      if (currentList && currentList.type !== 'ol') {
        const listNode = flushList(i);
        if (listNode) blocks.push(listNode);
      }
      if (!currentList) {
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(itemText);
      continue;
    }

    // Empty line
    if (trimmed === '') {
      if (currentList) {
        const listNode = flushList(i);
        if (listNode) blocks.push(listNode);
      }
      blocks.push(<div key={`space-${i}`} className="h-1.5" />);
      continue;
    }

    // Standard paragraph line
    if (currentList) {
      const listNode = flushList(i);
      if (listNode) blocks.push(listNode);
    }
    blocks.push(
      <p key={i} className="leading-relaxed text-slate-600 font-medium my-1">
        {renderInline(line)}
      </p>
    );
  }

  // Flush remaining list
  if (currentList) {
    const listNode = flushList(lines.length);
    if (listNode) blocks.push(listNode);
  }

  return <div className="space-y-0.5 text-slate-600 font-sans">{blocks}</div>;
};
