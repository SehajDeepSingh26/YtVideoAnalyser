import express from 'express';
import { YoutubeTranscript } from 'youtube-transcript';
import cors from "cors"

const app = express();

app.use(cors())
app.use(express.json());

app.post('/get-transcript', async (req, res) => {
    try {
        const { url } = req.body;

        const transcript = await YoutubeTranscript.fetchTranscript(url);
        // console.log(transcript);

        const transcriptText = transcript.map(item => item.text).join(' ');

        const summaryResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer sk-e8be341407c049d4ac2c444616570197`, // API key from .env
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "user",
                        content: `Here is the transcript of the YouTube video: ${transcriptText}. Provide a short summarized description of the video.`,
                    },
                ],
                temperature: 0.7,
            }),
        });

        const summary = await summaryResponse.json();

        // console.log(summary.choices[0].message);

        res.json({ 
            transcript: transcriptText, // Send the combined text
            summary: summary.choices[0].message,
        });
    } catch (error) {
        console.error('Error fetching transcript:', error);
        res.status(500).json({ error: 'Failed to fetch transcript' });
    }
});


app.post('/chat', async (req, res) => {
    try {
        const { transcript, userInput } = req.body;

        if (!transcript || !userInput) {
            return res.status(400).json({ error: 'Transcript and user input are required.' });
        }
        // console.log(process.env.DEEPSEEK_API_KEY)

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer sk-e8be341407c049d4ac2c444616570197`, // API key from .env
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "user",
                        content: `Here is the transcript of the YouTube video: ${transcript} now a user wants to ask a question: ${userInput}. Give an appropriate response relevant to the video.`,
                    },
                ],
                temperature: 0.7,
            }),
        });

        const result = await response.json();
        // console.log(result.choices[0].message)
        res.json(
            { 
                response: result.choices[0].message || 'No response from AI.'
             }
        );
    } catch (error) {
        console.error('Error during chat interaction:', error);
        res.status(500).json({ error: 'An error occurred while communicating with DeepSeek AI.' });
    }
});

app.listen(5000, () => console.log('Server running on port 5000'));
