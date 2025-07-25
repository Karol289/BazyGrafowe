
const LlmLogo = () => {
    return (
        <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={50}
                  height={50}
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path fill="#fff" fillOpacity={0.01} d="M0 0h48v48H0z" />
                  <rect
                    width={30}
                    height={26}
                    x={9}
                    y={17}
                    stroke="#000"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={4}
                    rx={2}
                  />
                  <path
                    stroke="#000"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={4}
                    d="m33 9-5 8M15 9l5 8"
                  />
                  <circle cx={34} cy={7} r={2} stroke="#000" strokeWidth={4} />
                  <circle cx={14} cy={7} r={2} stroke="#000" strokeWidth={4} />
                  <rect
                    width={16}
                    height={8}
                    x={16}
                    y={24}
                    // fill="#2F88FF"
                    stroke="#000"
                    strokeWidth={4}
                    rx={4}
                  />
                  <path
                    stroke="#000"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={4}
                    d="M9 24H4v10h5M39 24h5v10h-5"
                  />
                </svg>
    )
}

export default LlmLogo
