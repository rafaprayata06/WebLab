
import express from 'express';
import cors from 'cors';

const app = express();

// karna frontend dan backand memeiliki perbedaan atar port cors ini yg menjadi penengah
app.use(cors({
    origin: 'http://localhost:5173'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'WebLab API is running!'
    });
});

export default app;
