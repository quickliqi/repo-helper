export default async function handler(req, res) {
 // Handle CORS preflight
 if (req.method === 'OPTIONS') {
 return res.status(200).end();
 }
 
 if (req.method !== 'POST') {
 return res.status(405).json({ error: 'Method not allowed' });
 }

 try {
 // Ping the AWS Swarm
 const swarmSecret = process.env.SWARM_SECRET_KEY || 'QL_SWARM_SECURE_9A4b7X1v_LIVE';
 
 const response = await fetch('http://54.213.177.197:8000', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'x-swarm-key': swarmSecret
 },
 body: JSON.stringify(req.body)
 });

 const data = await response.json();
 return res.status(200).json(data);
 
 } catch (error) {
 return res.status(500).json({ error: error.message, detail: "AWS Swarm unreachable" });
 }
}