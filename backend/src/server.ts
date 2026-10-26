import dotenv from 'dotenv';
import { app } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CourtX Arena Backend API is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📋 Employees Endpoint: http://localhost:${PORT}/api/employees`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
