"use client";

import { useState, useRef, useEffect } from "react";
import { generate } from "./lib/gemini";
import { buildPromptMenu } from "./lib/gemini";
import menu from "./data/menu.json";
import { motion, AnimatePresence } from "framer-motion";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { toast } from "react-toastify";
import { FiSend, FiRefreshCw, FiSun, FiMoon } from "react-icons/fi";

export default function ChatPage() {
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [hasInitialized, setHasInitialized] = useState(false);
	const [darkMode, setDarkMode] = useState(false);

	const messagesEndRef = useRef(null);

	useEffect(() => {
		const savedMode = localStorage.getItem("darkMode");
		if (savedMode !== null) {
			setDarkMode(savedMode === "true");
		} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
			setDarkMode(true);
		}
	}, []);

	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
		localStorage.setItem("darkMode", darkMode);
	}, [darkMode]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		if (!hasInitialized && messages.length === 0) {
			handleSend("Ada apa saja menu disini?");
			setHasInitialized(true);
		}
	}, [hasInitialized]);

	const toggleDarkMode = () => {
		setDarkMode(!darkMode);
	};

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const handleSend = async (initialInput) => {
		const messageText = (initialInput ?? input).trim();

		if (!messageText) {
			toast.error("Tolong masukkan pertanyaan terlebih dahulu!");
			return;
		}

		if (messageText.length > 100) {
			toast.error("Pesan terlalu panjang. Maksimal 100 karakter!");
			return;
		}

		const dangerousPattern =
			/<script[\s\S]*?>[\s\S]*?<\/script>|javascript:|on\w+="[^"]*"/gi;
		if (dangerousPattern.test(messageText)) {
			toast.error("Terdeteksi karakter tidak aman dalam pesan!");
			return;
		}

		if (messages.length >= 50) {
			toast.error("Batas pesan tercapai. Silakan mulai ulang percakapan.");
			return;
		}

		const userMessage = {
			role: "user",
			text: messageText,
			id: crypto.randomUUID(),
		};
		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setLoading(true);

		try {
			const prompt = buildPromptMenu(menu, messageText);
			const botReply = await generate(prompt);
			const botMessage = {
				role: "bot",
				text: botReply,
				id: crypto.randomUUID(),
			};
			setMessages((prev) => [...prev, botMessage]);
		} catch (error) {
			console.log(error);
			setMessages((prev) => [
				...prev,
				{
					role: "bot",
					text: "❌ Terjadi kesalahan. Coba lagi ya!",
					id: Date.now() + 1,
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	const resetChat = () => {
		setMessages([]);
		setHasInitialized(false);
	};

	return (
		<div
			className={`flex flex-col h-screen transition-colors duration-300 ${
				darkMode
					? "dark bg-gradient-to-br from-gray-900 to-blue-900 text-gray-100"
					: "bg-gradient-to-br from-gray-50 to-blue-50 text-gray-800"
			}`}
		>
			{/* Header */}
			<motion.header
				initial={{ y: -20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.5 }}
				className={`px-6 py-4 shadow-lg ${
					darkMode
						? "bg-gradient-to-r from-blue-800 to-indigo-800"
						: "bg-gradient-to-r from-blue-600 to-indigo-600"
				}`}
			>
				<div className="max-w-4xl mx-auto flex justify-between items-center">
					<div className="flex items-center space-x-3">
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
							className={`w-8 h-8 rounded-full flex items-center justify-center ${
								darkMode ? "bg-white/10" : "bg-white/20"
							}`}
						>
							<div
								className={`w-6 h-6 rounded-full ${
									darkMode ? "bg-white/20" : "bg-white/30"
								}`}
							></div>
						</motion.div>
						<h1 className="text-xl font-bold tracking-tight text-white">Food Assistant</h1>
					</div>
					<div className="flex items-center gap-3">
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={toggleDarkMode}
							className={`p-2 rounded-full cursor-pointer ${
								darkMode
									? "bg-indigo-700 text-yellow-200"
									: "bg-blue-100 text-blue-700"
							}`}
						>
							{darkMode ? (
								<FiSun className="w-5 h-5" />
							) : (
								<FiMoon className="w-5 h-5" />
							)}
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={resetChat}
							className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-white cursor-pointer ${
								darkMode
									? "bg-white/10 hover:bg-white/20"
									: "bg-white/20 hover:bg-white/30"
							}`}
						>
							<FiRefreshCw className="w-4 h-4" />
							<span>New Chat</span>
						</motion.button>
					</div>
				</div>
			</motion.header>

			{/* Chat Container */}
			<div className="flex-1 overflow-y-auto p-4 pb-20 max-w-4xl w-full mx-auto">
				<AnimatePresence>
					{messages.length === 0 && !loading && (
						<motion.div
							key="empty-state"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							className="flex flex-col items-center justify-center h-full text-center space-y-4"
						>
							<div
								className={`w-24 h-24 rounded-full flex items-center justify-center ${
									darkMode ? "bg-blue-900" : "bg-blue-100"
								}`}
							>
								<div
									className={`w-16 h-16 rounded-full flex items-center justify-center ${
										darkMode ? "bg-blue-800" : "bg-blue-200"
									}`}
								>
									<div
										className={`w-10 h-10 rounded-full ${
											darkMode ? "bg-blue-700" : "bg-blue-300"
										}`}
									></div>
								</div>
							</div>
							<h2
								className={`text-xl font-medium ${
									darkMode ? "text-gray-200" : "text-gray-700"
								}`}
							>
								Ask about our menu
							</h2>
							<p
								className={`max-w-md ${
									darkMode ? "text-gray-400" : "text-gray-500"
								}`}
							>
								I can help you find delicious food and drinks from our menu.
							</p>
						</motion.div>
					)}

					{messages.map((msg, i) => (
						<motion.div
							key={msg.id || i}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
							className={`mb-4 flex ${
								msg.role === "user" ? "justify-end" : "justify-start"
							}`}
						>
							<div
								className={`max-w-[80%] rounded-2xl px-5 py-3 ${
									msg.role === "user"
										? `text-white rounded-br-none ${
												darkMode
													? "bg-gradient-to-r from-blue-700 to-indigo-700"
													: "bg-gradient-to-r from-blue-500 to-indigo-500"
										}`
										: `shadow-md rounded-bl-none ${
												darkMode
													? "bg-gray-800 text-gray-100"
													: "bg-white text-gray-800"
										}`
								}`}
							>
								{msg.role === "bot" ? (
									<MarkdownPreview
										source={msg.text}
										style={{
											background: "transparent",
											color: "inherit",
											fontFamily: "inherit",
											fontSize: "inherit",
										}}
										className={`prose prose-sm max-w-none ${
											darkMode ? "prose-invert" : ""
										}`}
									/>
								) : (
									<div className="whitespace-pre-wrap">{msg.text}</div>
								)}
							</div>
						</motion.div>
					))}

					{loading && (
						<motion.div
							key="loading-indicator"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex justify-start mb-4"
						>
							<div
								className={`px-5 py-3 rounded-2xl shadow-md rounded-bl-none max-w-[80%] ${
									darkMode
										? "bg-gray-800 text-gray-100"
										: "bg-white text-gray-800"
								}`}
							>
								<div className="flex space-x-2">
									<div
										className={`w-2 h-2 rounded-full animate-bounce ${
											darkMode ? "bg-blue-400" : "bg-blue-500"
										}`}
										style={{ animationDelay: "0ms" }}
									></div>
									<div
										className={`w-2 h-2 rounded-full animate-bounce ${
											darkMode ? "bg-blue-400" : "bg-blue-500"
										}`}
										style={{ animationDelay: "150ms" }}
									></div>
									<div
										className={`w-2 h-2 rounded-full animate-bounce ${
											darkMode ? "bg-blue-400" : "bg-blue-500"
										}`}
										style={{ animationDelay: "300ms" }}
									></div>
								</div>
							</div>
						</motion.div>
					)}

					<div ref={messagesEndRef} />
				</AnimatePresence>
			</div>

			{/* Input Area */}
			<motion.div
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.3 }}
				className={`fixed bottom-0 left-0 right-0 py-4 px-4 shadow-lg ${
					darkMode
						? "bg-gray-800 border-t border-gray-700"
						: "bg-white border-t border-gray-200"
				}`}
			>
				<div className="max-w-4xl mx-auto flex items-center gap-3">
					<motion.div
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className="flex-1 relative"
					>
						<input
							type="text"
							value={input}
							onChange={(e) => {
								const value = e.target.value;
								if (value.length <= 300) setInput(value);
							}}
							onKeyDown={(e) => e.key === "Enter" && handleSend(null)}
							className={`w-full border rounded-full px-5 py-3 pr-12 focus:outline-none focus:ring-2 transition-all duration-200 ${
								darkMode
									? "bg-gray-700 border-gray-600 focus:ring-blue-600 focus:border-transparent text-white"
									: "bg-gray-50 border-gray-300 focus:ring-blue-500 focus:border-transparent"
							}`}
							placeholder="Tanya tentang menu kami..."
						/>
						{input && (
							<motion.span
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className={`absolute right-3 top-3 text-xs px-2 py-0.5 rounded-full ${
									darkMode
										? "text-gray-300 bg-gray-600"
										: "text-gray-400 bg-gray-100"
								}`}
							>
								{input.length}/300
							</motion.span>
						)}
					</motion.div>

					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => handleSend(null)}
						disabled={loading || !input.trim()}
						className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
							loading || !input.trim()
								? darkMode
									? "bg-gray-600 text-gray-400 cursor-not-allowed"
									: "bg-gray-300 text-gray-500 cursor-not-allowed"
								: `text-white ${
										darkMode
											? "bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 shadow-blue-700/30"
											: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/30"
								}`
						}`}
					>
						{loading ? (
							<FiRefreshCw className="w-5 h-5 animate-spin opacity-90" />
						) : (
							<FiSend className="w-5 h-5 hover:opacity-90 cursor-pointer" />
						)}
					</motion.button>
				</div>
			</motion.div>
		</div>
	);
}
