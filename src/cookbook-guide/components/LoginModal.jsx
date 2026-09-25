import { useState } from 'react';
import Modal from './Modal';

export default function LoginModal({ open, onClose, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const errMsg = await onLogin(email.trim(), password);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setEmail('');
    setPassword('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Eboard Login" width="clamp(260px, 22vw, 340px)">
      <input
        type="email"
        className="e-input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
      />
      <input
        type="password"
        className="e-input"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
      />
      <button className="e-btn-primary" onClick={handleLogin}>
        Log in
      </button>
      <div className="e-error">{error}</div>
    </Modal>
  );
}
