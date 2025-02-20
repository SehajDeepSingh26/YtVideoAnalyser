/* eslint-disable no-undef */
import express from 'express';
import { YoutubeTranscript } from 'youtube-transcript';
import cors from "cors"
import  dotenv  from 'dotenv';

dotenv.config()

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
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`, // API key from .env
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
        console.log("getting summary")
        console.log(summaryResponse);

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

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "user",
                        content: `Here is the transcript of the YouTube video: ${transcript}. Now a user wants to ask a question: ${userInput}. Provide an appropriate 4-5 line response relevant to the video. If the information is not described in the video, perform a web search to get the information, but specify that it was found on the web. But the answer may be outdated.`,
                    },
                ],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch chat response: ${response.statusText}`);
        }

        let result;
        try {
            result = await response.json();
        } 
        catch (jsonError) {
            throw new Error('Failed to parse JSON response from DeepSeek API.', jsonError);
        }

        res.json({
            response: result?.choices[0]?.message ,
        });
    } catch (error) {
        console.error('Error during chat interaction:', error.message);
        res.status(500).json({ error: error.message || 'An error occurred while communicating with DeepSeek AI.' });
    }
});


app.listen(5000, () => console.log('Server running on port 5000'));
