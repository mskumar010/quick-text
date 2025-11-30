// HomePage.tsx
import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import './globalStyles.css';
import { useUid } from './IdContext';
export default function HomePage() {
	const [messageInput, setMessageInput] = useState('');
	const [messageSent, setMessageSent] = useState(false);
	const [isDarkMode, setIsDarkMode] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
const SERVER_URL='https://share-text-1wmi.onrender.com'
	useEffect(() => {
		if (isDarkMode) {
			document.body.classList.add('dark-mode');
		} else {
			document.body.classList.remove('dark-mode');
		}
	}, [isDarkMode]);

	const idRef = useRef(crypto.randomUUID().slice(0, 4));
	const id = idRef.current;
	const { uid, setUid } = useUid() ?? { uid: '', setUid: () => {} };

	useEffect(() => {
		setUid(id);
	}, []);

	useEffect(() => {
		if (!uid) return;
		console.log('uid updated:', uid);
	}, [uid]);

	async function sendMessage(msg: string) {
		setIsLoading(true);

		try {
			const res = await axios.post(SERVER_URL, {
				message: msg,
				id: uid,
			});
			console.log('POST:', res.data);
			setMessageSent(true);
		} catch (error) {
			console.error('Error sending message:', error);
		} finally {
			setIsLoading(false);
		}
	}

	const handleSendMessage = () => {
		if (!messageInput.trim()) return;
		sendMessage(messageInput);
		setMessageInput('');
	};

	const generateQRCode = (text: string): string => {
		return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
			text
		)}&bgcolor=ffffff&color=000000&margin=20`;
	};

	return (
		<div className="app">
			{/* Header */}
			<header className="header">
				<div className="container">
					<div className="header-inner">
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

						<div className="header-right">
							{/* <div className="status-pill">
                <span className="status-dot"></span>
                <span className="status-id">{uid}</span>
              </div> */}

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

							{/* <a href="/view" className="nav-link">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
									<circle cx="12" cy="12" r="3" />
								</svg>
								View
							</a> */}
						</div>
					</div>
				</div>
			</header>

			{/* Main */}
			<main className="main">
				<div className="container">
					<div className="main-grid">
						{/* Left - Composer */}
						<div className="composer-section">
							<div className="section-header">
								<h1 className="page-title">Share Your Message</h1>
								<p className="page-subtitle">
									Create a shareable link instantly
								</p>
							</div>

							<div className="glass-card composer-card">
								<label className="label">
									<span className="label-dot"></span>
									Your Message
								</label>

								<textarea
									className="message-input"
									placeholder="Start typing your message here..."
									value={messageInput}
									onChange={(e) => setMessageInput(e.target.value)}
								/>

								<div className="composer-footer">
									<div className="composer-meta">
										<span className="char-count">
											{messageInput.length} characters
										</span>
										{messageInput.length > 0 && (
											<span className="ready-tag">Ready</span>
										)}
									</div>

									<button
										className="btn-primary"
										onClick={handleSendMessage}
										disabled={!messageInput.trim() || isLoading}>
										{isLoading ? (
											<>
												<span className="spinner"></span>
												Sending...
											</>
										) : (
											<>
												<svg
													width="16"
													height="16"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2">
													<line x1="22" y1="2" x2="11" y2="13" />
													<polygon points="22 2 15 22 11 13 2 9 22 2" />
												</svg>
												Send Message
											</>
										)}
									</button>
								</div>
							</div>
						</div>

						{/* Right - Result */}
						<div className="result-section">
							{messageSent ? (
								<div className="glass-card result-card">
									<div className="result-header">
										<div className="success-badge">
											<svg
												width="20"
												height="20"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="3">
												<polyline points="20 6 9 17 4 12" />
											</svg>
											<span>Message Sent</span>
										</div>
									</div>

									<div className="result-content">
										<div className="link-section">
											<div className="link-header">
												<svg
													width="18"
													height="18"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2">
													<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
													<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
												</svg>
												<span>Shareable Link</span>
											</div>
											<div className="link-display">
												`https://share-txt-skm.vercel.app/view/{uid}`
											</div>
											<button className="btn-copy">
												<svg
													width="16"
													height="16"
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
												Copy Link
											</button>
										</div>

										<div className="qr-section">
											<div className="qr-header">
												<svg
													width="18"
													height="18"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2">
													<rect x="3" y="3" width="7" height="7" />
													<rect x="14" y="3" width="7" height="7" />
													<rect x="14" y="14" width="7" height="7" />
													<rect x="3" y="14" width="7" height="7" />
												</svg>
												<span>QR Code</span>
											</div>
											<div className="qr-container">
												<img
													src={generateQRCode(
														`${SERVER_URL}/${uid}`
													)}
													alt="QR Code"
													className="qr-image"
												/>
											</div>
											<p className="qr-hint">Scan to view message</p>
										</div>

										<div className="action-group">
											<a
												href={`/view/${uid}`}
												className="btn-secondary"
												style={{ background: 'dodgerblue' }}>
												<svg
													width="16"
													height="16"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2">
													<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
													<circle cx="12" cy="12" r="3" />
												</svg>
												View Message
											</a>
											<button
												className="btn-secondary"
												onClick={() => {
													setMessageSent(false);
													setMessageInput('');
												}}>
												Send Another
											</button>
										</div>
									</div>
								</div>
							) : (
								<div className="glass-card empty-card">
									<div className="empty-icon">
										<svg
											width="48"
											height="48"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5">
											<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
										</svg>
									</div>
									<h3 className="empty-title">Your Result Will Appear Here</h3>
									<p className="empty-text">
										Type your message and click send to generate a shareable
										link with QR code
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

