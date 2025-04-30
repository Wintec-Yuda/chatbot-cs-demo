"use client";

import { useState, useRef, useEffect } from "react";
import { generate } from "./lib/gemini";
import { buildPromptMenu } from "./lib/gemini";
import menu from "./data/menu.json";
import { motion } from "framer-motion";
import MarkdownPreview from "@uiw/react-markdown-preview";

export default function ChatPage() {
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Create a reference to the container that holds the messages
	const messagesEndRef = useRef(null);

	// Scroll to the bottom whenever messages change
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	useEffect(() => {
		// Jalankan hanya saat komponen pertama kali dimount
		handleSend("Ada apa saja menu disini?");
	}, []);

	const handleSend = async (initialInput) => {
		const messageText = initialInput ?? input;

		if (!messageText.trim()) {
			setError("Tolong masukkan pertanyaan terlebih dahulu!");
			return;
		}

		const userMessage = { role: "user", text: messageText };
		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setLoading(true);
		setError("");

		try {
			const prompt = buildPromptMenu(menu, messageText);
			const botReply = await generate(prompt);
			const botMessage = { role: "bot", text: botReply };
			setMessages((prev) => [...prev, botMessage]);
		} catch (error) {
			console.log(error);
			setMessages((prev) => [
				...prev,
				{ role: "bot", text: "❌ Tolong ulangi pertanyaanmu!" },
			]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col h-screen bg-gray-50">
			<div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-lg font-semibold px-4 py-3 shadow-md shadow-blue-400">
				ChatBot Gemini Demo
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.map((msg, i) => (
					<div
						key={i}
						className={`max-w-xl px-6 py-3 rounded-xl ${
							msg.role === "user"
								? "bg-blue-500 text-white self-end ml-auto"
								: "bg-white text-black self-start"
						} transition-all duration-300`}
					>
						{msg.role === "bot" ? (
							<MarkdownPreview
								source={msg.text}
								style={{ background: "transparent", color: "inherit" }}
							/>
						) : (
							<div>{msg.text}</div>
						)}
					</div>
				))}

				{loading && (
					<div className="bg-gray-400 text-white px-4 py-2 rounded-lg w-fit self-start animate-pulse">
						<span>💬 Mengetik...</span>
					</div>
				)}

				{error && (
					<motion.div
						className="bg-red-500 text-white px-4 py-2 rounded-lg w-full text-center"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.5 }}
					>
						{error}
					</motion.div>
				)}

				{/* Scroll target */}
				<div ref={messagesEndRef} />
			</div>

			<div className="border-t bg-white p-4 flex items-center gap-2 shadow-xl rounded-lg mt-auto">
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleSend(null)}
					className="flex-1 border border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ease-in-out"
					placeholder="Tulis pesanmu..."
				/>
				<button
					onClick={() => handleSend(null)}
					className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 ease-in-out flex items-center justify-center"
					disabled={loading}
				>
					{loading ? (
						<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
					) : (
						"Kirim"
					)}
				</button>
			</div>
		</div>
	);
}
