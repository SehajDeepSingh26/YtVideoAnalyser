import { useState } from 'react';
import { Send, Loader2, Bell, User, Search } from 'lucide-react';

const VideoSummarizer = () => {
    const [url, setUrl] = useState('');
    const [transcript, setTranscript] = useState("");
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');

    const extractVideoId = (url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const handleUrlSubmit = async () => {
        try {
            setLoading(true);
            const videoId = extractVideoId(url);
            if (!videoId) {
                alert('Invalid YouTube URL');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_APP_BACKEND_URL}/get-transcript`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });
            const data = await response.json();
            setTranscript(data.transcript);
            setSummary(data.summary.content || 'Unable to generate summary.');
        } 
        catch (error) {
            console.error('Error fetching transcript:', error);
            alert('An error occurred while fetching the transcript.');
        } 
        finally {
            setLoading(false);
        }
    };

    const handleChat = async () => {
        if (!userInput.trim()) return;

        try {
            setLoading(true);
            const newMessages = [...messages, { role: 'user', content: userInput }];
            setMessages(newMessages);

            const response = await fetch(`${import.meta.env.VITE_APP_BACKEND_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transcript,
                    userInput,
                }),
            });

            const data = await response.json();
            const aiResponse = data.response?.content || 'Server Timed out, No response from AI.';

            setMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
            setUserInput('');
        } catch (error) {
            console.error('Error during chat interaction:', error);
            alert('An error occurred while communicating with the backend.');
        } finally {
            setLoading(false);
        }
    };

    const removeSummary = () => {
        console.log("----------------------------------")
        setSummary("")
        setUrl("")
    }

    return (
        <div className="w-screen h-screen bg-[#0F0F0F] text-white flex flex-col">
            {/* Navbar */}
            <nav className="w-full bg-[#181818] flex items-center justify-between p-4 fixed top-0 z-50 shadow-lg">
                {/* Logo */}
                <div className="text-red-600 text-2xl font-bold" onClick={removeSummary}>YouSummarize</div>

                {/* Search Bar */}
                <div className="flex items-center bg-[#121212] border border-gray-600 rounded-full px-4 py-2 w-1/3">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent text-white w-full outline-none"
                    />
                    <Search className="text-gray-400" />
                </div>

                {/* Icons */}
                <div className="flex space-x-6">
                    <Bell className="text-gray-300 hover:text-white cursor-pointer" />
                    <User className="text-gray-300 hover:text-white cursor-pointer" />
                </div>
            </nav>

            {/* Main Content (Starts after navbar height) */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 mt-16">
                {!summary ? (
                    // URL Input Screen
                    <div className="bg-[#1C1C1C] shadow-lg rounded-xl p-6 w-full max-w-2xl">
                        <h2 className="text-2xl font-semibold mb-4 text-center">YouTube Video Summarizer</h2>
                        <div className="flex items-center space-x-4">
                            <input
                                type="text"
                                placeholder="Enter YouTube URL"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="flex-1 border border-gray-600 bg-[#121212] text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <button
                                onClick={handleUrlSubmit}
                                disabled={loading || !url}
                                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Get Summary'}
                            </button>
                        </div>
                    </div>
                ) : (
                    // Main Content Layout (2-Column Split)
                    <div className="w-full h-full flex">
                        {/* Left Section: URL Input & Summary */}
                        <div className="w-1/2 p-6 bg-[#0F0F0F]">
                            <div className="bg-[#1C1C1C] shadow-lg rounded-xl p-6 mb-6">
                                <h2 className="text-xl font-semibold mb-4">YouTube Video Summary</h2>
                                <input
                                    type="text"
                                    value={url}
                                    disabled
                                    className="w-full border border-gray-600 bg-[#121212] text-white rounded-lg p-2"
                                />
                            </div>

                            <div className="bg-[#1C1C1C] shadow-lg rounded-xl p-6">
                                <h2 className="text-xl font-semibold mb-4">Summary</h2>
                                <p className="text-gray-300 text-sm">{summary}</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-[2px] bg-gray-700"></div>

                        {/* Right Section: Chat Panel */}
                        <div className="w-1/2 p-6 bg-[#0F0F0F]">
                            <div className="bg-[#1C1C1C] shadow-lg rounded-xl p-6 h-full flex flex-col">
                                <h2 className="text-xl font-semibold mb-4">Ask Anything about the Video</h2>

                                <div className="flex-1 space-y-4 overflow-y-auto p-4 border border-gray-700 rounded-lg bg-[#121212]">
                                    {messages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] p-3 rounded-xl ${message.role === 'user'
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-gray-800 text-gray-300'
                                                    }`}
                                            >
                                                {message.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center space-x-4 mt-4">
                                    <input
                                        type="text"
                                        placeholder="Ask something..."
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                                        className="flex-1 border border-gray-600 bg-[#121212] text-white rounded-lg p-2"
                                        disabled={loading}
                                    />
                                    <button onClick={handleChat} className="px-4 py-2 bg-red-600 text-white rounded-lg">
                                        {loading ? <Loader2 className="animate-spin" /> : <Send className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoSummarizer;
