import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

const VideoSummarizer = () => {
    const [url, setUrl] = useState('');
    const [transcript, setTranscript] = useState([]);
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
            console.log("url correct")

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

            // console.log(data)

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
        // console.log(transcript)
    
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
            // console.log(data)
            const aiResponse = data.response.content || 'No response from AI.';
    
            setMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
            setUserInput('');
        } catch (error) {
            console.error('Error during chat interaction:', error);
            alert('An error occurred while communicating with the backend.');
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
            {/* URL Input Section */}
            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Video URL Input</h2>
                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        placeholder="Enter YouTube URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-300"
                    />
                    <button
                        onClick={handleUrlSubmit}
                        disabled={loading || !url}
                        className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Get Summary'}
                    </button>
                </div>
            </div>

            {/* Summary Section */}
            {summary && (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Video Summary</h2>
                    <p className="text-gray-700 text-sm">{summary}</p>
                </div>
            )}

            {/* Chat Section */}
            {summary && (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Chat about the Video</h2>
                    <div className="space-y-4 h-96 overflow-y-auto p-4 border border-gray-200 rounded-lg">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-700'
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
                            placeholder="Ask about the video..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                            className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-300"
                            disabled={loading}
                        />
                        <button
                            onClick={handleChat}
                            disabled={loading || !userInput}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoSummarizer;
