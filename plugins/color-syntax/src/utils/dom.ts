function hasClass(element: HTMLElement, className: string) {
  return element.classList.contains(className);
}

export function findParentByClassName(el: HTMLElement, className: string) {
  let currentEl: HTMLElement | null = el;

  while (currentEl && !hasClass(currentEl, className)) {
    currentEl = currentEl.parentElement;
  }

  return currentEl;
}

export function removeProseMirrorHackNodes(html: string) {
  const reProseMirrorImage = /<img class="ProseMirror-separator" alt="">/g;
  const reProseMirrorTrailingBreak = / class="ProseMirror-trailingBreak"/g;

  let resultHTML = html;

  resultHTML = resultHTML.replace(reProseMirrorImage, '');
  resultHTML = resultHTML.replace(reProseMirrorTrailingBreak, '');

  return resultHTML;
}

// inline style string to object
export function inlineStyleToObject(style: string) {
  if (typeof style !== 'string') return {};
  // style string sanitizer: replace any break line characters with empty string
  const sanitizedStyle = style.replace(/(\r\n|\n|\r)/gm, '').replace(/"/g, "'");

  return sanitizedStyle.split(';').reduce((acc: any, propertyValue) => {
    const [property, value] = propertyValue.split(':').map((item: string) => item.trim());

    if (property && value) {
      acc[property] = value;
    }
    return acc;
  }, {});
}

// Check if it's Microsodt Offlice's style from inline-style string
export function isMicrosoftOfficeStyle(styleObject: { [key: string]: string }) {
  for (const key in styleObject) {
    if (key.toLowerCase().startsWith('mso')) {
      return true;
    }
  }
  return false;
}

export function isBlackOrWhite(color: string) {
  const lowercaseColor = color.toLowerCase().trim();

  if (
    lowercaseColor === 'black' ||
    lowercaseColor === '#000' ||
    lowercaseColor === '#000000' ||
    lowercaseColor === 'white' ||
    lowercaseColor === '#fff' ||
    lowercaseColor === '#ffffff'
  ) {
    return true;
  }

  return false;
}
