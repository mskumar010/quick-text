// ViewPage.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import './globalStyles.css';


interface HistoryItem {
  message: string;
  timestamp: number;
  preview: string;
}

export default function ViewPage() {
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('messageHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    axios.get('https://share-text-1wmi.onrender.com/view')
      .then((res) => {
        const msg = res.data;
        setMessage(msg);
        
        if (msg && msg !== 'No message yet') {
          const newItem: HistoryItem = {
            message: msg,
            timestamp: Date.now(),
            preview: msg.slice(0, 60) + (msg.length > 60 ? '...' : '')
          };
          
          const updatedHistory = [newItem, ...history].slice(0, 10);
          setHistory(updatedHistory);
          localStorage.setItem('messageHistory', JSON.stringify(updatedHistory));
        }
        
        setIsLoading(false);
      })
      .catch(() => {
        setMessage('Failed to load message');
        setIsLoading(false);
      });
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadHistory = (item: HistoryItem) => {
    setMessage(item.message);
  };

  return (
		<div className="app">
			{/* Header */}
			<header className="header">
				<div className="container">
					<div className="header-inner">
						{/* <a href="/" className="back-link">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2">
								<line x1="19" y1="12" x2="5" y2="12" />
								<polyline points="12 19 5 12 12 5" />
							</svg>
							Back
						</a> */}

						<div className="brand">
							<div className="brand-icon">
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2">
									<path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
								</svg>
							</div>
							<span className="brand-name">ShareText</span>
						</div>

						<button
							className="theme-toggle"
							onClick={() => setIsDarkMode(!isDarkMode)}
							aria-label="Toggle theme">
							<div className="toggle-track">
								<div className={`toggle-thumb ${isDarkMode ? 'active' : ''}`}>
									{isDarkMode ? '🌙' : '☀️'}
								</div>
							</div>
						</button>
					</div>
				</div>
			</header>

			{/* Main */}
			<main className="main">
				<div className="container">
					<div className="view-grid">
						{/* Left - Message */}
						<div className="message-section">
							<div className="section-header">
								<h1 className="page-title">Shared Message</h1>
								<p className="page-subtitle">View and copy the message</p>
							</div>

							{isLoading ? (
								<div className="glass-card loading-card">
									<span className="spinner large"></span>
									<p>Loading message...</p>
								</div>
							) : (
								<div className="glass-card message-card">
									<div className="message-header">
										<div className="success-badge">
											<svg
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="3">
												<polyline points="20 6 9 17 4 12" />
											</svg>
											<span>Retrieved</span>
										</div>

										<button
											className={`btn-copy-small ${copied ? 'copied' : ''}`}
											onClick={handleCopy}>
											{copied ? (
												<>
													<svg
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2">
														<polyline points="20 6 9 17 4 12" />
													</svg>
													Copied
												</>
											) : (
												<>
													<svg
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2">
														<rect
															x="9"
															y="9"
															width="13"
															height="13"
															rx="2"
															ry="2"
														/>
														<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
													</svg>
													Copy
												</>
											)}
										</button>
									</div>

									<div className="message-display">{message}</div>

									<div className="message-meta">
										<span>
											{message.split(' ').filter((w) => w).length} words
										</span>
										<span>{message.length} characters</span>
									</div>
								</div>
							)}

							<div className="action-center">
								<a href="/" className="btn-primary">
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2">
										<line x1="12" y1="5" x2="12" y2="19" />
										<line x1="5" y1="12" x2="19" y2="12" />
									</svg>
									Create your New Message
								</a>
							</div>
						</div>

						{/* Right - History */}
						<div className="history-section">
							<div className="glass-card history-card">
								<div className="history-header">
									<div className="history-title">
										<svg
											width="18"
											height="18"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2">
											<circle cx="12" cy="12" r="10" />
											<polyline points="12 6 12 12 16 14" />
										</svg>
										<span>Recent History</span>
									</div>
									<span className="history-count">{history.length}/10</span>
								</div>

								<div className="history-list">
									{history.length > 0 ? (
										history.map((item, index) => (
											<button
												key={index}
												className="history-item"
												onClick={() => loadHistory(item)}>
												<div className="history-item-header">
													<span className="history-index">#{index + 1}</span>
													<span className="history-time">
														{new Date(item.timestamp).toLocaleTimeString([], {
															hour: '2-digit',
															minute: '2-digit',
														})}
													</span>
												</div>
												<p className="history-preview">{item.preview}</p>
											</button>
										))
									) : (
										<div className="history-empty">
											<svg
												width="32"
												height="32"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="1.5">
												<circle cx="12" cy="12" r="10" />
												<polyline points="12 6 12 12 16 14" />
											</svg>
											<p>No history yet</p>
											<span>Messages you view will appear here</span>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);

}
