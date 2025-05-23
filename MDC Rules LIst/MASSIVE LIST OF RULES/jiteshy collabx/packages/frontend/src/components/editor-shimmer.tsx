import React from 'react';

export function EditorShimmer() {
  return (
    <div className="h-full w-full bg-[#18181b] dark:bg-[#18181b] animate-pulse">
      {/* Editor header */}
      <div className="h-8 border-b border-[#27272a] flex items-center px-4">
        <div className="h-4 w-20 bg-[#27272a] rounded" />
      </div>

      {/* Editor content */}
      <div className="p-4 space-y-3">
        {/* Line numbers and content */}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-8 h-4 bg-[#27272a] rounded" />
            <div
              className="flex-1 h-4 bg-[#27272a] rounded"
              style={{ width: `${Math.random() * 80 + 20}%` }}
            />
          </div>
        ))}
      </div>

      {/* Editor footer */}
      <div className="absolute bottom-0 left-0 right-0 h-8 border-t border-[#27272a] flex items-center px-4">
        <div className="h-4 w-24 bg-[#27272a] rounded" />
      </div>
    </div>
  );
}
