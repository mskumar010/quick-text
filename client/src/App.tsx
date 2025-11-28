import { useState, useEffect } from 'react';
import {
	Copy,
	Send,
	Check,
	Link2,
	Sparkles,
	History,
	QrCode,
	ArrowLeft,
	Globe,
} from 'lucide-react';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:9090';

interface MessageHistory {
	id: string;
	message: string;
	timestamp: number;
	preview: string;
}

export default function App() {
	const [currentPage, setCurrentPage] = useState<'send' | 'view'>('send');
	const [message, setMessage] = useState<string>('');
	const [socket, setSocket] = useState<Socket | null>(null);
	const [userId, setUserId] = useState<string>('');
	const [generatedLink, setGeneratedLink] = useState<string>('');
	const [copied, setCopied] = useState<boolean>(false);
	const [linkCopied, setLinkCopied] = useState<boolean>(false);
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [showQR, setShowQR] = useState<boolean>(false);

	// View page
	const [viewUserId, setViewUserId] = useState<string>('');
	const [receivedMessage, setReceivedMessage] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([]);

	useEffect(() => {
		const currentSocket: Socket = io(SOCKET_URL, {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 10,
		});

		setSocket(currentSocket);

		currentSocket.on('connect', () => {
			console.log('Connected!');
			setIsConnected(true);
		});

		currentSocket.on('connect_error', (err) => {
			console.error('Connection error:', err);
			setIsConnected(false);
		});

		currentSocket.on('disconnect', () => {
			setIsConnected(false);
		});

		currentSocket.on('assignedUserId', (id: string) => {
			setUserId(id);
			console.log('Assigned user ID:', id);
		});

		currentSocket.on(
			'messageResponse',
			(data: { message: string; userId: string }) => {
				setReceivedMessage(data.message);

				// Add to history
				const newHistory: MessageHistory = {
					id: data.userId,
					message: data.message,
					timestamp: Date.now(),
					preview:
						data.message.slice(0, 50) + (data.message.length > 50 ? '...' : ''),
				};

				setMessageHistory((prev) => {
					const filtered = prev.filter((item) => item.id !== data.userId);
					return [newHistory, ...filtered].slice(0, 5);
				});

				setIsLoading(false);
				console.log('Message received:', data);
			}
		);

		currentSocket.on('messageNotFound', () => {
			setReceivedMessage('');
			setIsLoading(false);
		});

		return () => {
			currentSocket.disconnect();
		};
	}, []);

	async function copyToClipboard(text: string, isLink = false) {
		try {
			await navigator.clipboard.writeText(text);
			if (isLink) {
				setLinkCopied(true);
				setTimeout(() => setLinkCopied(false), 2000);
			} else {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	}

	function sendMessage() {
		if (!message.trim() || !userId) return;

		socket?.emit('storeMessage', { userId, message });
		const link = `textshare.app/${userId}`;
		setGeneratedLink(link);
		setShowQR(false);
		console.log('Message sent for user:', userId);
	}

	function fetchMessage() {
		if (!viewUserId.trim()) return;

		setIsLoading(true);
		setReceivedMessage('');
		socket?.emit('requestMessage', viewUserId.toLowerCase().trim());
	}

	function loadFromHistory(item: MessageHistory) {
		setViewUserId(item.id);
		setReceivedMessage(item.message);
	}

	function generateQRCode(text: string): string {
		return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
			text
		)}`;
	}

	const SendPage = () => (
		<div className="min-h-screen bg-black text-white flex flex-col">
			{/* Header */}
			<header className="border-b border-white/10 backdrop-blur-xl bg-black/50 sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
								<Globe className="w-5 h-5" />
							</div>
							<div>
								<h2 className="text-lg font-bold">TextShare</h2>
								<p className="text-xs text-white/50">Share instantly</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div
								className={`flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10`}>
								<div
									className={`w-1.5 h-1.5 rounded-full ${
										isConnected ? 'bg-green-400' : 'bg-red-400'
									}`}></div>
								<span className="text-xs font-medium hidden sm:inline">
									{userId || 'Connecting...'}
								</span>
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 gap-6">
				{/* Left Column - Composer */}
				<div className="flex-1 flex flex-col gap-6">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
								Share Your
								<br />
								Message
							</h1>
							<button
								onClick={() => setCurrentPage('view')}
								className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5">
								<History size={16} />
								<span className="hidden sm:inline">View</span>
							</button>
						</div>
						<p className="text-white/50 text-sm">
							Create a shareable link in seconds
						</p>
					</div>

					{/* Text Area */}
					<div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 flex flex-col">
						<label className="text-sm font-medium text-white/70 mb-3">
							Your Message
						</label>
						<textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Type your message here..."
							className="flex-1 bg-transparent border-none text-white placeholder-white/30 focus:outline-none resize-none text-base sm:text-lg min-h-[200px] sm:min-h-[300px]"
						/>
						<div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
							<span className="text-xs text-white/40">
								{message.length} characters
							</span>
							<button
								onClick={sendMessage}
								disabled={!message.trim() || !isConnected}
								className="bg-white hover:bg-white/90 text-black font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105 active:scale-95">
								<Send size={18} />
								Generate Link
							</button>
						</div>
					</div>
				</div>

				{/* Right Column - Link Display */}
				<div className="lg:w-[420px] flex flex-col gap-6">
					{generatedLink ? (
						<>
							{/* Link Card */}
							<div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-white/10 rounded-xl">
										<Link2 size={20} className="text-purple-400" />
									</div>
									<div className="flex-1">
										<div className="text-sm font-semibold">Your Link</div>
										<div className="text-xs text-white/50">
											Share with anyone
										</div>
									</div>
								</div>

								<div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 font-mono text-sm break-all">
									{generatedLink}
								</div>

								<div className="grid grid-cols-2 gap-3">
									<button
										onClick={() => copyToClipboard(generatedLink, true)}
										className="bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 hover:scale-105 active:scale-95">
										{linkCopied ? <Check size={16} /> : <Copy size={16} />}
										<span className="text-sm font-medium">
											{linkCopied ? 'Copied' : 'Copy'}
										</span>
									</button>

									<button
										onClick={() => setShowQR(!showQR)}
										className="bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 hover:scale-105 active:scale-95">
										<QrCode size={16} />
										<span className="text-sm font-medium">QR Code</span>
									</button>
								</div>

								{showQR && (
									<div className="bg-white rounded-2xl p-4 flex items-center justify-center animate-in fade-in slide-in-from-top-4 duration-500">
										<img
											src={generateQRCode(generatedLink)}
											alt="QR Code"
											className="w-full max-w-[240px] h-auto"
										/>
									</div>
								)}
							</div>

							{/* Tips */}
							<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-2">
								<div className="flex items-center gap-2 text-white/70 text-sm">
									<Sparkles size={14} />
									<span className="font-medium">Pro Tips</span>
								</div>
								<ul className="space-y-1.5 text-xs text-white/50">
									<li>• Links expire after 24 hours</li>
									<li>• Anyone with the link can view</li>
									<li>• Use QR codes for mobile sharing</li>
								</ul>
							</div>
						</>
					) : (
						<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[300px]">
							<div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
								<Link2 size={28} className="text-white/30" />
							</div>
							<div>
								<div className="text-sm font-medium text-white/70">
									No link yet
								</div>
								<div className="text-xs text-white/40 mt-1">
									Your shareable link will appear here
								</div>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);

	const ViewPage = () => (
		<div className="min-h-screen bg-black text-white flex flex-col">
			{/* Header */}
			<header className="border-b border-white/10 backdrop-blur-xl bg-black/50 sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<button
							onClick={() => setCurrentPage('send')}
							className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
							<ArrowLeft size={20} />
							<span className="font-medium">Back</span>
						</button>

						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
								<History className="w-5 h-5" />
							</div>
							<div>
								<h2 className="text-lg font-bold">View Message</h2>
								<p className="text-xs text-white/50">Enter user ID</p>
							</div>
						</div>

						<div className="w-20"></div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 gap-6">
				{/* Left Column - Input & Message */}
				<div className="flex-1 flex flex-col gap-6">
					{/* Search Box */}
					<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4">
						<div className="space-y-3">
							<label className="text-sm font-medium text-white/70">
								User ID
							</label>
							<input
								type="text"
								value={viewUserId}
								onChange={(e) => setViewUserId(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && fetchMessage()}
								placeholder="e.g., cozy-sky-42"
								className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-base"
							/>
						</div>

						<button
							onClick={fetchMessage}
							disabled={!viewUserId.trim() || isLoading || !isConnected}
							className="w-full bg-white hover:bg-white/90 text-black font-semibold py-3.5 px-6 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98">
							{isLoading ? (
								<>
									<div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
									Fetching...
								</>
							) : (
								<>
									<Send size={18} />
									Fetch Message
								</>
							)}
						</button>
					</div>

					{/* Message Display */}
					{receivedMessage && (
						<div className="flex-1 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-white/10 rounded-xl">
										<Check size={20} className="text-green-400" />
									</div>
									<div>
										<div className="text-sm font-semibold">
											Message Retrieved
										</div>
										<div className="text-xs text-white/50">
											From {viewUserId}
										</div>
									</div>
								</div>

								<button
									onClick={() => copyToClipboard(receivedMessage)}
									className="bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-white/10 hover:scale-105 active:scale-95">
									{copied ? (
										<>
											<Check size={16} className="text-green-400" />
											<span className="text-sm font-medium hidden sm:inline">
												Copied
											</span>
										</>
									) : (
										<>
											<Copy size={16} />
											<span className="text-sm font-medium hidden sm:inline">
												Copy
											</span>
										</>
									)}
								</button>
							</div>

							<div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-white/90 whitespace-pre-wrap break-words min-h-[200px] max-h-[400px] overflow-y-auto">
								{receivedMessage}
							</div>
						</div>
					)}

					{!receivedMessage && !isLoading && (
						<div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[300px]">
							<div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
								<Send size={28} className="text-white/30" />
							</div>
							<div>
								<div className="text-sm font-medium text-white/70">
									Enter a user ID
								</div>
								<div className="text-xs text-white/40 mt-1">
									The message will appear here
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Right Column - History */}
				<div className="lg:w-[380px] flex flex-col gap-6">
					<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4">
						<div className="flex items-center gap-2">
							<History size={18} className="text-white/70" />
							<h3 className="text-sm font-semibold text-white/90">
								Recent Messages
							</h3>
							<span className="ml-auto text-xs text-white/40">
								{messageHistory.length}/5
							</span>
						</div>

						{messageHistory.length > 0 ? (
							<div className="space-y-2">
								{messageHistory.map((item, index) => (
									<button
										key={item.id + index}
										onClick={() => loadFromHistory(item)}
										className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 text-left transition-all group hover:scale-[1.02] active:scale-98">
										<div className="flex items-center justify-between mb-2">
											<span className="text-xs font-mono text-purple-400">
												{item.id}
											</span>
											<span className="text-xs text-white/40">
												{new Date(item.timestamp).toLocaleTimeString([], {
													hour: '2-digit',
													minute: '2-digit',
												})}
											</span>
										</div>
										<p className="text-sm text-white/70 line-clamp-2 group-hover:text-white/90 transition-colors">
											{item.preview}
										</p>
									</button>
								))}
							</div>
						) : (
							<div className="text-center py-8">
								<div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
									<History size={20} className="text-white/30" />
								</div>
								<p className="text-xs text-white/40">No recent messages</p>
							</div>
						)}
					</div>

					{/* Info Card */}
					<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-2">
						<div className="flex items-center gap-2 text-white/70 text-sm">
							<Sparkles size={14} />
							<span className="font-medium">History</span>
						</div>
						<ul className="space-y-1.5 text-xs text-white/50">
							<li>• Last 5 messages are saved locally</li>
							<li>• Click any message to view again</li>
							<li>• History clears on page refresh</li>
						</ul>
					</div>
				</div>
			</main>
		</div>
	);

	return currentPage === 'send' ? <SendPage /> : <ViewPage />;
}
