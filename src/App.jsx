import profilePic from './assets/cbcpic.jpg'
import './App.css'

const links = [
  {
    label: '@hunter.cbc',
    href: 'https://www.instagram.com/hunter.cbc/',
    icon: (
      <svg viewBox="0 0 48 48" className="link-icon" aria-hidden="true">
        <defs>
          <radialGradient id="ig-gradient" cx="30%" cy="107%" r="150%">
            <stop offset="0" stopColor="#fdf497" />
            <stop offset="0.05" stopColor="#fdf497" />
            <stop offset="0.45" stopColor="#fd5949" />
            <stop offset="0.6" stopColor="#d6249f" />
            <stop offset="0.9" stopColor="#285aeb" />
          </radialGradient>
        </defs>
        <rect width="48" height="48" rx="14" fill="url(#ig-gradient)" />
        <rect
          x="10"
          y="10"
          width="28"
          height="28"
          rx="8"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
        />
        <circle cx="24" cy="24" r="7" fill="none" stroke="#fff" strokeWidth="2.5" />
        <circle cx="33.5" cy="14.5" r="1.8" fill="#fff" />
      </svg>
    ),
  },
]

function App() {
  return (
    <div className="page">
      <div className="card">
        <div className="plate">
          <img src={profilePic} alt="Cookbook Club" className="avatar" />
        </div>

        <h1 className="title">Cookbook Club</h1>
        <p className="subtitle">Hunter College</p>

        <div className="links">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-button"
            >
              {link.icon}
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
