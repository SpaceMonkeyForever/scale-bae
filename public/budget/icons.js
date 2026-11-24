const paths = {
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5m10-5v5M3 11h18"/>',
  wallet:'<path d="M20 8V6a2 2 0 0 0-2-2L5 6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h15V8H5"/><path d="M20 12h-4v4h4"/>',
  pen:'<path d="m4 16-1 5 5-1L20 8l-4-4L4 16Zm10-10 4 4"/>',
  mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>',
  letter:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 6 9 7 9-7"/>',
  "arrow-up-right":'<path d="M6 18 18 6M7 6h11v11"/>',
  "arrow-right":'<path d="M3 12h17m-7-7 7 7-7 7"/>',
  x:'<path d="m6 6 12 12M18 6 6 18"/>', plus:'<path d="M12 4v16M4 12h16"/>',
  home:'<path d="m2 11 10-8 10 8M5 9v12h14V9m-9 12v-7h4v7"/>',
  bike:'<circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="m6 16 4-8 5 8H6m13 0-4-12h-3M7 8h5"/>',
  bolt:'<path d="M14 2 4 14h7l-1 8 10-13h-7z"/>',
  basket:'<path d="m5 10 5-7m9 7-5-7M2 10h20l-3 10H5zM9 13v4m6-4v4"/>',
  tool:'<path d="M20 3a6 6 0 0 0-8 7L4 18a2 2 0 0 0 3 3l8-8a6 6 0 0 0 7-8l-4 4-3-3z"/>',
  "plus-box":'<rect x="3" y="4" width="18" height="16" rx="4"/><path d="M12 8v8m-4-4h8"/>',
  chevron:'<path d="m9 6 6 6-6 6"/>', note:'<path d="M5 3h14v18H5zm4 5h6m-6 4h6m-6 4h4"/>'
};
export function icon(name) {return '<svg class="ico" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' + (paths[name] || paths.note) + '</svg>';}
