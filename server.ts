import express, { Request, Response } from "express";
import dotenv from "dotenv";
import axios from "axios";
import path from "path";

dotenv.config();

const app = express();
const PORT = 3000;

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_URL = "https://api.github.com";

const clientId = process.env.GITHUB_CLIENT_ID as string;
const clientSecret = process.env.GITHUB_CLIENT_SECRET as string;
const callbackUrl = process.env.GITHUB_CALLBACK_URL as string;

app.use(express.static(path.join(__dirname, "public")));

app.get("/auth/github", (req: Request, res: Response) => {
  const githubAuthUrl = `${GITHUB_AUTH_URL}?client_id=${clientId}&redirect_uri=${callbackUrl}&scope=read:user repo`;
  res.redirect(githubAuthUrl);
});

app.get("/oauth/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;

  try {
    const tokenResponse = await axios.post(
      GITHUB_TOKEN_URL,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl, // Ensure redirect_uri is included if needed
      }),
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    
    const accessToken = tokenResponse.data.access_token;

    if (accessToken) {
      const userInfoResponse = await axios.get(`${GITHUB_API_URL}/user`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const reposResponse = await axios.get(`${GITHUB_API_URL}/user/repos`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      res.json({
        profile: userInfoResponse.data,
        repositories: reposResponse.data,
      });
    } else {
      res.status(500).send("Error retrieving access token");
    }
  } catch (error) {
    res.status(500).send("Authentication failed");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
