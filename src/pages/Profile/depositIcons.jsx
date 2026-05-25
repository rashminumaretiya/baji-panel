// Raw SVG strings copied verbatim from
// baji-exchange-frontend/src/app/shared/assets/svg.ts (matches the `safe` pipe
// payload used in deposit.component.html). For unknown names we render an
// empty `<i>` — same behavior as Angular's `[innerHTML]="undefined"`.
const ICONS = {
  close: `<svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="SVGRepo_iconCarrier"><path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="currentColor"/></g></svg>`,

  nagad: `<svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 48 48"><defs><style>.a{fill:none;stroke:currentColor;stroke-width:3px;stroke-linecap:round;stroke-linejoin:round;}</style></defs><path class="a" d="M18.8808,6.3975A19.3468,19.3468,0,1,0,42.3963,19.3847"/><path class="a" d="M14.9194,25.893C14.8584,21.68,17.4842,13.8021,26.4,9.955L22.7968,3.5432C17.4231,6.169,10.2174,15.2066,14.9194,25.893Z"/><path class="a" d="M22.136,12.4087a16.7784,16.7784,0,0,0-2.9215,8.8424c1.8394-3.7912,7.7259-9.6477,17.4192-9.0767l-.3362-7.347A17.9936,17.9936,0,0,0,25.6848,8.683"/><path class="a" d="M34.4651,12.1527A16.506,16.506,0,0,0,23.896,20.28c3.3473-2.56,11.238-5.1453,19.64-.2781l3.0022-6.7141a17.7464,17.7464,0,0,0-9.9239-1.5322"/><path class="a" d="M13.4377,20.0692a11.6039,11.6039,0,1,0,19.0467-2.7711"/></svg>`,

  bkash: `<svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 48 48"><defs><style>.a{fill:none;stroke:currentColor;stroke-width:3px;stroke-linecap:round;stroke-linejoin:round;}</style></defs><path class="a" d="M22.9814,8.6317s-4.1632,14.704-3.8089,14.704,16.4755,2.923,16.4755,2.923Z"/><polyline class="a" points="22.981 8.632 6.329 6.152 19.172 23.336 21.387 33.522 35.648 26.259 39.368 17.445 30.393 18.946"/><polyline class="a" points="37.929 20.855 43 20.855 39.368 17.445"/><polyline class="a" points="21.387 33.522 21.741 35.427 13.725 41.848 19.172 23.336"/><polyline class="a" points="35.648 26.259 35.117 29.138 22.848 32.778"/><polyline class="a" points="8.455 8.997 5 8.997 16.044 19.15"/></svg>`,

  rocket: `<svg xmlns="http://www.w3.org/2000/svg" width="30px" height="40px" viewBox="0 0 30 29" version="1.1"><g><path style="stroke:none;fill-rule:nonzero;fill:currentColor;fill-opacity:1;" d="M 3.175781 7.757812 C 10.640625 7.757812 18.105469 7.757812 25.796875 7.757812 C 25.6875 7.980469 25.574219 8.199219 25.457031 8.417969 L 22.597656 13.667969 C 16.105469 13.675781 16.105469 13.675781 9.480469 13.6875 L 23.207031 29 C 22.007812 29.007812 20.8125 29.011719 19.613281 29.015625 L 14.109375 29.035156 C 13.8125 29.042969 13.8125 29.042969 13.695312 28.9375 L 0 13.621094 C 0.015625 13.570312 0.015625 13.570312 0.046875 13.511719 L 3.175781 7.757812 Z"/><path style="stroke:none;fill-rule:nonzero;fill:currentColor;fill-opacity:1;" d="M 7.402344 0 L 30 0 L 26.917969 5.699219 C 26.796875 5.734375 26.675781 5.730469 26.546875 5.726562 L 4.320312 5.699219 L 7.402344 0 Z"/></g></svg>`,

  mobileBanking: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" version="1.1" width="800px" height="800px" viewBox="0 0 210 256"><path d="M174.55,144.5c-1.4-4-5-6.5-9.2-6.5H159V23c0-11.708-9.292-21-21-21H25C12.57,2,2,12.57,2,25v183c0,11.9,10.95,22,22.75,22l114.213,0c1.207,0,2.27,0.984,2.18,2.188c-0.095,1.266-1.153,1.812-2.393,1.812h-45.5L128,254h80L174.55,144.5z M82.05,220.2c-3.199,0-5.599-2.399-5.6-5.598c-0.001-3.045,2.557-5.602,5.602-5.602c3.199,0.001,5.598,2.401,5.598,5.6C87.55,217.8,85.25,220.2,82.05,220.2z M144,138h-19.65c-5.3,0-9.8,4.7-9.8,10c0,5.3,4.5,10,9.8,10h19.8v42H18V31h126V138z"/></svg>`,

  // Used by DepositHistory's "Upload ScreenShot" action button — verbatim
  // from baji-exchange-frontend svg.ts (simplified to the visible path).
  uploadSS: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  // arrowRoundBox — verbatim from sbex-user-fe core/constant/svg.ts:425-434.
  // Hardcoded `#000000` fills/strokes swapped to `currentColor` so the icon
  // adopts the surrounding button's text colour (baji-panel renders it inside
  // an action button with `text-(--primary)`).
  arrowRoundBox: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="24" height="24" viewBox="0 0 1024 1024" stroke="currentColor" stroke-width="20.48"><path d="M829.44 911.36c45.245 0 81.92-36.675 81.92-81.92V194.56c0-45.245-36.675-81.92-81.92-81.92H194.56c-45.245 0-81.92 36.675-81.92 81.92v634.88c0 45.245 36.675 81.92 81.92 81.92h634.88zm0 40.96H194.56c-67.866 0-122.88-55.014-122.88-122.88V194.56c0-67.866 55.014-122.88 122.88-122.88h634.88c67.866 0 122.88 55.014 122.88 122.88v634.88c0 67.866-55.014 122.88-122.88 122.88z"/><path d="M356.352 398.811h249.856c70.128 0 126.976 56.848 126.976 126.976v4.096c0 70.128-56.848 126.976-126.976 126.976H311.296c-11.311 0-20.48 9.169-20.48 20.48s9.169 20.48 20.48 20.48h294.912c92.75 0 167.936-75.186 167.936-167.936v-4.096c0-92.75-75.186-167.936-167.936-167.936H356.352c-11.311 0-20.48 9.169-20.48 20.48s9.169 20.48 20.48 20.48z"/><path d="M372.792 291.219l-70.963 70.963c-7.998 7.998-7.998 20.965 0 28.963s20.965 7.998 28.963 0l70.963-70.963c7.998-7.998 7.998-20.965 0-28.963s-20.965-7.998-28.963 0z"/><path d="M400.018 435.165l-70.963-70.963c-7.998-7.998-20.965-7.998-28.963 0s-7.998 20.965 0 28.963l70.963 70.963c7.998 7.998 20.965 7.998 28.963 0s7.998-20.965 0-28.963z"/></svg>`,

  // Copy-to-clipboard glyph for the verify-payment card disabled-input rows.
  // sbex-user-fe pulls this from its `svg.ts` via the `| svg` pipe; here we
  // inline the same shape so the icon styles consistently with surrounding text.
  copyIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z" fill="currentColor"/></svg>`,
}

export function Icon({ name, className }) {
  const svg = ICONS[name]
  if (!svg) return <i className={className} />
  return (
    <i
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
