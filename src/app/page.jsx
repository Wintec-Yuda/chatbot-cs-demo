"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { generate } from "./lib/gemini";
import { buildPromptMenuId, buildPromptMenuEn } from "./lib/gemini";
import menu from "./data/menu.json";
import { motion, AnimatePresence } from "framer-motion";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { toast } from "react-toastify";
import { FiSend, FiRefreshCw, FiSun, FiMoon, FiGlobe } from "react-icons/fi";

// Constants
const MAX_MESSAGE_LENGTH = 100;
const MAX_MESSAGES = 50;
const MAX_HISTORY_LENGTH = 5; // Number of previous messages to include in context

export default function ChatPage() {
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [hasInitialized, setHasInitialized] = useState(false);
	const [darkMode, setDarkMode] = useState(false);
	const [isInitializing, setIsInitializing] = useState(true);
	const [language, setLanguage] = useState("id"); // 'id' or 'en'
	const messagesEndRef = useRef(null);

	// Initialize dark mode and language from localStorage
	useEffect(() => {
		const savedMode = localStorage.getItem("darkMode");
		const savedLang = localStorage.getItem("language");

		if (savedMode !== null) {
			setDarkMode(savedMode === "true");
		} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
			setDarkMode(true);
		}

		if (savedLang && ["id", "en"].includes(savedLang)) {
			setLanguage(savedLang);
		}

		setIsInitializing(false);
	}, []);

	// Apply dark mode class to document
	useEffect(() => {
		document.documentElement.classList.toggle("dark", darkMode);
		localStorage.setItem("darkMode", darkMode);
	}, [darkMode]);

	// Save language preference
	useEffect(() => {
		localStorage.setItem("language", language);
	}, [language]);

	// Scroll to bottom when messages change
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Initialize with welcome message if empty
	useEffect(() => {
		if (!hasInitialized && messages.length === 0 && !isInitializing) {
			console.log("language", language);

			const welcomeMessage =
				language === "id"
					? "Ada apa saja menu disini?"
					: "What menus are available here?";
			console.log("Initializing with welcome message:", welcomeMessage);

			handleSend(welcomeMessage);
			setHasInitialized(true);
		}
	}, [hasInitialized, messages.length, language, isInitializing]);

	const resetChat = () => {
		setMessages([]);
		setHasInitialized(false);
		toast.success(
			language === "id"
				? "Percakapan baru telah dimulai"
				: "New conversation started"
		);
	};

	const toggleDarkMode = () => setDarkMode(!darkMode);
	const toggleLanguage = () => {
		const newLanguage = language === "id" ? "en" : "id";
		setLanguage(newLanguage);
		localStorage.setItem("language", newLanguage);
		resetChat();
	};

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const validateInput = (text) => {
		if (!text.trim()) {
			toast.error(
				language === "id"
					? "Tolong masukkan pertanyaan terlebih dahulu!"
					: "Please enter your question first!"
			);
			return false;
		}

		if (text.length > MAX_MESSAGE_LENGTH) {
			toast.error(
				language === "id"
					? `Pesan terlalu panjang. Maksimal ${MAX_MESSAGE_LENGTH} karakter!`
					: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters!`
			);
			return false;
		}

		const dangerousPattern =
			/<script[\s\S]*?>[\s\S]*?<\/script>|javascript:|on\w+="[^"]*"/gi;
		if (dangerousPattern.test(text)) {
			toast.error(
				language === "id"
					? "Terdeteksi karakter tidak aman dalam pesan!"
					: "Detected unsafe characters in message!"
			);
			return false;
		}

		if (messages.length >= MAX_MESSAGES) {
			toast.error(
				language === "id"
					? "Batas pesan tercapai. Silakan mulai ulang percakapan."
					: "Message limit reached. Please start a new conversation."
			);
			return false;
		}

		return true;
	};

	const handleSend = useCallback(
		async (initialInput) => {
			const messageText = (initialInput ?? input).trim();
			if (!validateInput(messageText)) return;

			const userMessage = {
				role: "user",
				text: messageText,
				id: crypto.randomUUID(),
				timestamp: new Date().toISOString(),
			};

			setMessages((prev) => [...prev, userMessage]);
			setInput("");
			setLoading(true);

			try {
				// Get recent messages for context (excluding current message)
				const recentHistory = messages.slice(-MAX_HISTORY_LENGTH);
				const prompt =
					language === "id"
						? buildPromptMenuId(menu, messageText, recentHistory)
						: buildPromptMenuEn(menu, messageText, recentHistory);
				const botReply = await generate(prompt);

				const botMessage = {
					role: "bot",
					text: botReply,
					id: crypto.randomUUID(),
					timestamp: new Date().toISOString(),
				};

				setMessages((prev) => [...prev, botMessage]);
			} catch (error) {
				console.error("Chat error:", error);
				setMessages((prev) => [
					...prev,
					{
						role: "bot",
						text:
							language === "id"
								? "❌ Terjadi kesalahan. Coba lagi ya!"
								: "❌ An error occurred. Please try again!",
						id: crypto.randomUUID(),
						timestamp: new Date().toISOString(),
					},
				]);
			} finally {
				setLoading(false);
			}
		},
		[input, messages, language]
	);

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	// UI Components
	const DarkModeToggle = () => (
		<motion.button
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			onClick={toggleDarkMode}
			className={`p-2 rounded-full cursor-pointer ${
				darkMode ? "bg-indigo-700 text-yellow-200" : "bg-blue-100 text-blue-700"
			}`}
			aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
		>
			{darkMode ? (
				<FiSun className="w-5 h-5" />
			) : (
				<FiMoon className="w-5 h-5" />
			)}
		</motion.button>
	);

	const LanguageToggle = () => (
		<motion.button
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			onClick={toggleLanguage}
			className={`p-2 rounded-full cursor-pointer ${
				darkMode ? "bg-indigo-700 text-white" : "bg-blue-100 text-blue-700"
			}`}
			aria-label={
				language === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"
			}
		>
			<div className="flex items-center gap-1">
				<FiGlobe className="w-5 h-5" />
				<span className="text-xs font-medium">
					{language === "id" ? "EN" : "ID"}
				</span>
			</div>
		</motion.button>
	);

	const ResetChatButton = () => (
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
			<span>{language === "id" ? "Percakapan Baru" : "New Chat"}</span>
		</motion.button>
	);

	const SendButton = () => (
		<motion.button
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			onClick={() => handleSend()}
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
			aria-label="Send message"
		>
			{loading ? (
				<FiRefreshCw className="w-5 h-5 animate-spin opacity-90" />
			) : (
				<FiSend className="w-5 h-5 hover:opacity-90 cursor-pointer" />
			)}
		</motion.button>
	);

	const MessageBubble = ({ msg }) => (
		<div
			className={`max-w-[80%] rounded-2xl px-5 py-3 ${
				msg.role === "user"
					? `text-white rounded-br-none ${
							darkMode
								? "bg-gradient-to-r from-blue-700 to-indigo-700"
								: "bg-gradient-to-r from-blue-500 to-indigo-500"
					  }`
					: `shadow-md rounded-bl-none ${
							darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"
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
	);

	const LoadingIndicator = () => (
		<div className="flex space-x-2">
			{[0, 150, 300].map((delay) => (
				<div
					key={delay}
					className={`w-2 h-2 rounded-full animate-bounce ${
						darkMode ? "bg-blue-400" : "bg-blue-500"
					}`}
					style={{ animationDelay: `${delay}ms` }}
				/>
			))}
		</div>
	);

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
							/>
						</motion.div>
						<h1 className="text-xl font-bold tracking-tight text-white">
							Alamasta
						</h1>
					</div>
					<div className="flex items-center gap-3">
						<LanguageToggle />
						<DarkModeToggle />
						<ResetChatButton />
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
									/>
								</div>
							</div>
							<h2
								className={`text-xl font-medium ${
									darkMode ? "text-gray-200" : "text-gray-700"
								}`}
							>
								{language === "id"
									? "Tanya tentang menu kami"
									: "Ask about our menu"}
							</h2>
							<p
								className={`max-w-md ${
									darkMode ? "text-gray-400" : "text-gray-500"
								}`}
							>
								{language === "id"
									? "Saya bisa membantu Anda menemukan makanan dan minuman lezat dari menu kami."
									: "I can help you find delicious food and drinks from our menu."}
							</p>
						</motion.div>
					)}

					{messages.map((msg) => (
						<motion.div
							key={msg.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
							className={`mb-4 flex ${
								msg.role === "user" ? "justify-end" : "justify-start"
							}`}
						>
							<MessageBubble msg={msg} />
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
								<LoadingIndicator />
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
							onChange={(e) =>
								setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))
							}
							onKeyDown={handleKeyDown}
							className={`w-full border rounded-full px-5 pt-4 pb-2 pr-12 focus:outline-none focus:ring-2 transition-all duration-200 ${
								darkMode
									? "bg-gray-700 border-gray-600 focus:ring-blue-600 focus:border-transparent text-white"
									: "bg-gray-50 border-gray-300 focus:ring-blue-500 focus:border-transparent"
							}`}
							placeholder={
								language === "id"
									? "Tanya tentang menu kami..."
									: "Ask about our menu..."
							}
							disabled={loading}
						/>
						{input && (
							<motion.span
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className={`absolute right-3 top-0 text-xs px-2 py-0.5 rounded-full ${
									darkMode
										? "text-gray-300 bg-gray-600"
										: "text-gray-400 bg-gray-100"
								}`}
							>
								{input.length}/{MAX_MESSAGE_LENGTH}
							</motion.span>
						)}
					</motion.div>
					<SendButton />
				</div>
			</motion.div>
		</div>
	);
}
