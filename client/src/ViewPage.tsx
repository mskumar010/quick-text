import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './globalStyles.css';
import { useParams } from 'react-router';
import { useUid } from './IdContext';

interface HistoryItem {
	message: string;
	timestamp: number;
	preview: string;
}

const SERVER_URL = 'https://share-text-1wmi.onrender.com';

export default function ViewPage() {
	const [message, setMessage] = useState('');
	const [copied, setCopied] = useState(false);
	const [copiedHistoryIndex, setCopiedHistoryIndex] = useState<number | null>(
		null
	);
	const [isDarkMode, setIsDarkMode] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [fetchTrigger, setFetchTrigger] = useState(0);
	const { uid } = useParams<{ uid: string }>();
	const abortControllerRef = useRef<AbortController | null>(null);
	const { sentNewMessage, setSentNewMessage } = useUid() ?? {
		sentNewMessage: false,
		setSentNewMessage: () => {},
	};

	useEffect(() => {
		if (isDarkMode) {
			document.body.classList.add('dark-mode');
		} else {
			document.body.classList.remove('dark-mode');
		}
	}, [isDarkMode]);

	// Trigger refetch when new message is sent
	useEffect(() => {
		if (sentNewMessage && uid) {
			console.log('New message received, refetching...');
			setFetchTrigger((prev) => prev + 1);
			// Reset the flag after triggering refetch
			if (setSentNewMessage) {
				setSentNewMessage(false);
			}
		}
	}, [sentNewMessage, uid, setSentNewMessage]);

	useEffect(() => {
		if (!uid) {
			setHistory([]);
			return;
		}
		const storedKey = `messageHistory_${uid}`;
		try {
			const raw = localStorage.getItem(storedKey);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (
					Array.isArray(parsed) &&
					parsed.every((item) => typeof item === 'object' && 'message' in item)
				) {
					setHistory(parsed);
				} else {
					setHistory([]);
				}
			} else {
				setHistory([]);
			}
		} catch {
			setHistory([]);
		}
	}, [uid]);

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
		console.log('UID from URL:', uid, 'Fetch trigger:', fetchTrigger);

		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		abortControllerRef.current = new AbortController();

		const fetchMessage = async () => {
			setIsLoading(true);
			setMessage('');

			try {
				const res = await axios.get(`${SERVER_URL}/view/${uid}`, {
					signal: abortControllerRef.current?.signal,
				});

				const msg = res.data;
				console.log('Received data from server:', msg);

				if (!abortControllerRef.current?.signal.aborted) {
					let messageText = '';

					if (
						!msg ||
						(typeof msg === 'object' && Object.keys(msg).length === 0)
					) {
						messageText = 'No message found for this ID';
					} else if (typeof msg === 'string') {
						messageText = msg;
					} else if (msg && typeof msg === 'object') {
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

					if (
						messageText &&
						messageText !== 'No message yet' &&
						messageText !== 'No message found for this ID' &&
						messageText !== 'Failed to load message' &&
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
							const storedKey = `messageHistory_${uid}`;
							let historyForThisId: HistoryItem[] = [];

							try {
								const raw = localStorage.getItem(storedKey);
								if (raw) {
									const parsed = JSON.parse(raw);
									if (
										Array.isArray(parsed) &&
										parsed.every(
											(item) => typeof item === 'object' && 'message' in item
										)
									) {
										historyForThisId = parsed;
									} else {
										historyForThisId = prevHistory;
									}
								} else {
									historyForThisId = prevHistory;
								}
							} catch {
								historyForThisId = prevHistory;
							}

							// Remove existing item with same message (if any) and add new one at top
							const filteredHistory = historyForThisId.filter(
								(item: HistoryItem) => item.message !== messageText
							);
							const updatedHistory = [newItem, ...filteredHistory].slice(0, 10);
							localStorage.setItem(storedKey, JSON.stringify(updatedHistory));
							return updatedHistory;
						});
					}
				}
			} catch (error) {
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

		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [uid, fetchTrigger]);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(message);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleRefresh = () => {
		setFetchTrigger((prev) => prev + 1);
	};

	const handleCopyHistory = async (
		item: HistoryItem,
		index: number,
		e: React.MouseEvent
	) => {
		e.stopPropagation(); // Prevent triggering the history item click
		await navigator.clipboard.writeText(item.message);
		setCopiedHistoryIndex(index);
		setTimeout(() => setCopiedHistoryIndex(null), 2000);
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

						<a href="https://share-txt-skm.vercel.app/" className="brand">
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
						</a>

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

										<div
											style={{
												display: 'flex',
												gap: '8px',
												alignItems: 'center',
											}}>
											<button
												className="btn-refresh"
												onClick={handleRefresh}
												disabled={isLoading}
												title="Refresh message">
												{isLoading ? (
													<span
														className="spinner"
														style={{
															width: '14px',
															height: '14px',
															borderWidth: '2px',
														}}></span>
												) : (
													<svg
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2">
														<polyline points="23 4 23 10 17 10" />
														<polyline points="1 20 1 14 7 14" />
														<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
													</svg>
												)}
											</button>

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
											<div key={index} className="history-item-wrapper">
												<button
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
												<button
													className={`history-copy-btn ${
														copiedHistoryIndex === index ? 'copied' : ''
													}`}
													onClick={(e) => handleCopyHistory(item, index, e)}
													title="Copy message">
													{copiedHistoryIndex === index ? (
														<svg
															width="14"
															height="14"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="2">
															<polyline points="20 6 9 17 4 12" />
														</svg>
													) : (
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
													)}
												</button>
											</div>
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
