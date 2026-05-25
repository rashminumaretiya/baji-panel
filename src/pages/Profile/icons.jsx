export function EditIcon() {
  return (
    <i className="cursor-pointer pl-1 leading-none">
      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9">
        <path
          d="m8.856 2.016-.912.912-1.872-1.872.912-.912A.481.481 0 0 1 7.338 0c.14 0 .258.048.354.144l1.164 1.164A.481.481 0 0 1 9 1.662c0 .14-.048.258-.144.354ZM0 7.128l5.532-5.532 1.872 1.872L1.872 9H0V7.128Z"
          fill="currentColor"
          fillRule="evenodd"
        />
      </svg>
    </i>
  )
}

export function VerifiedIcon() {
  return (
    <i className="inline-flex leading-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <circle cx="8" cy="8" r="8" fill="#1e88f0" />
        <path
          d="M4.5 8.2l2.3 2.3 4.7-4.8"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </i>
  )
}
