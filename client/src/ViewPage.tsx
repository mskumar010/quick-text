// ViewPage.tsx
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './globalStyles.css';
import { useParams } from 'react-router';

interface HistoryItem {
	message: string;
	timestamp: number;
	preview: string;
}

export default function ViewPage() {
	const [message, setMessage] = useState('');
	const [copied, setCopied] = useState(false);
	const [isDarkMode, setIsDarkMode] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [history, setHistory] = useState<HistoryItem[]>(() => {
		const savedHistory = localStorage.getItem('messageHistory');
		return savedHistory ? JSON.parse(savedHistory) : [];
	});
	const { uid } = useParams<{ uid: string }>();
	const abortControllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		if (isDarkMode) {
			document.body.classList.add('dark-mode');
		} else {
			document.body.classList.remove('dark-mode');
		}
	}, [isDarkMode]);

	// This effect runs whenever 'message' state updates
	useEffect(() => {
		if (message) {
			console.log('Message state updated to:', message);
		}
	}, [message]);

	useEffect(() => {
		if (!uid) {
			console.log('No UID in URL');
			setMessage('');
			return;
		}

		console.log('UID from URL:', uid);

		// Cancel any ongoing request
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Create new abort controller for this request
		abortControllerRef.current = new AbortController();

		const fetchMessage = async () => {
			setIsLoading(true);
			setMessage(''); // Clear previous message

			try {
				const res = await axios.get(`http://localhost:9090/view/${uid}`, {
					signal: abortControllerRef.current?.signal,
				});

				const msg = res.data;
				console.log('Received data from server:', msg);

				// Only update if component is still mounted and request wasn't aborted
				if (!abortControllerRef.current?.signal.aborted) {
					// Server returns an object with currentMessage, id, ts properties
					let messageText = '';

					if (
						!msg ||
						(typeof msg === 'object' && Object.keys(msg).length === 0)
					) {
						messageText = 'No message found for this ID';
					} else if (typeof msg === 'string') {
						messageText = msg;
					} else if (msg && typeof msg === 'object') {
						// Handle server response format: { currentMessage, id, ts }
						messageText =
							msg.currentMessage ||
							msg.message ||
							msg.text ||
							'No message available';
					} else {
						messageText = String(msg);
					}

					console.log('Extracted message text:', messageText);
					setMessage(messageText);

					// Add to history if message is valid
					if (
						messageText &&
						messageText !== 'No message yet' &&
						messageText.trim() !== ''
					) {
						const newItem: HistoryItem = {
							message: messageText,
							timestamp: Date.now(),
							preview:
								messageText.slice(0, 60) +
								(messageText.length > 60 ? '...' : ''),
						};

						setHistory((prevHistory) => {
							// Prevent duplicates - check if message already exists
							const exists = prevHistory.some(
								(item) => item.message === messageText
							);
							if (exists) {
								return prevHistory;
							}

							const updatedHistory = [newItem, ...prevHistory].slice(0, 10);
							localStorage.setItem(
								'messageHistory',
								JSON.stringify(updatedHistory)
							);
							return updatedHistory;
						});
					}
				}
			} catch (error) {
				// Don't update state if request was aborted
				if (
					error instanceof Error &&
					(error.name === 'CanceledError' || error.name === 'AbortError')
				) {
					console.log('Request was canceled');
					return;
				}

				console.error('Error fetching message:', error);
				if (!abortControllerRef.current?.signal.aborted) {
					setMessage('Failed to load message');
				}
			} finally {
				if (!abortControllerRef.current?.signal.aborted) {
					setIsLoading(false);
				}
			}
		};

		fetchMessage();

		// Cleanup function
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [uid]);

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

									<div className="message-display">
										{typeof message === 'object' &&
										message !== null &&
										'currentMessage' in message
											? (message as { currentMessage?: string })
													.currentMessage || 'No message available'
											: typeof message === 'string' && message.trim()
											? message
											: 'No message available'}
									</div>

									<div className="message-meta">
										<span>
											{message ? message.split(' ').filter((w) => w).length : 0}{' '}
											words
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
