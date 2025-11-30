import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './globalStyles.css';
import { useParams } from 'react-router';

interface HistoryItem {
	message: string;
	timestamp: number;
	preview: string;
}

const SERVER_URL = "https://share-text-1wmi.onrender.com";

export default function ViewPage() {
	const [message, setMessage] = useState('');
	const [copied, setCopied] = useState(false);
	const [isDarkMode, setIsDarkMode] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const { uid } = useParams<{ uid: string }>();
	const abortControllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		if (isDarkMode) {
			document.body.classList.add('dark-mode');
		} else {
			document.body.classList.remove('dark-mode');
		}
	}, [isDarkMode]);

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
				if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'object' && 'message' in item)) {
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
		console.log('UID from URL:', uid);

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
							msg.currentMessage || msg.message || msg.text || 'No message available';
					} else {
						messageText = String(msg);
					}

					console.log('Extracted message text:', messageText);
					setMessage(messageText);

					if (
						messageText &&
						messageText !== 'No message yet' &&
						messageText.trim() !== ''
					) {
						const newItem: HistoryItem = {
							message: messageText,
							timestamp: Date.now(),
							preview: messageText.slice(0, 60) + (messageText.length > 60 ? '...' : ''),
						};

						setHistory(() => {
							const storedKey = `messageHistory_${uid}`;
							let historyForThisId: HistoryItem[] = [];

							try {
								const raw = localStorage.getItem(storedKey);
								if (raw) {
									const parsed = JSON.parse(raw);
									if (
										Array.isArray(parsed) &&
										parsed.every((item) => typeof item === 'object' && 'message' in item)
									) {
										historyForThisId = parsed;
									} else {
										historyForThisId = [];
									}
								}
							} catch {
								historyForThisId = [];
							}

							const exists = historyForThisId.some((item: HistoryItem) => item.message === messageText);
							if (exists) {
								return historyForThisId;
							}

							const updatedHistory = [newItem, ...historyForThisId].slice(0, 10);
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
			{/* ... (rest of component remains unchanged) ... */}
		</div>
	);
}
