import express from "express";
import { getCompleteMetrics } from "../metricsService/index.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { db } from "../../database/src/prisma/db.ts";
import { decrypt } from "../utils/encryption.js";
import { GithubApiError } from "../utils/githubError.js";



const router = express.Router();

router.get(
  "/:owner/:repo",
  authMiddleware,
  async (req, res) => {
    try {
      const { owner, repo } = req.params;

      if (!owner || !repo) {
        return res.status(400).json({
          error: "Repository owner and name are required",
        });
      }

      

      const githubAccount =
        await db.orm.public.GithubAccount
          .where({
            userId: req.user.userId,
          })
          .first();

      if (!githubAccount) {
        return res.status(404).json({
          error: "GitHub account is not connected",
        });
      }

      

      const fullName = `${owner}/${repo}`;

      const selectedRepository =
        await db.orm.public.Repository
          .where({
            githubAccountId: githubAccount.id,
            fullName,
          })
          .first();

      if (!selectedRepository) {
        return res.status(404).json({
          error:
            "Repository is not selected or GitHub account is not connected",
        });
      }

      

      const githubToken =
        decrypt(githubAccount.encryptedToken);

      if (!githubToken) {
        return res.status(401).json({
          error: "GitHub token is unavailable",
        });
      }

     

      const metrics =
        await getCompleteMetrics({
          user: owner,
          repo,
          githubToken,
        });

      return res.status(200).json(metrics);

    } catch (error) {
      console.error(
    "Calculate repository metrics error:",
    error
  );

  if (error instanceof GithubApiError) {
    return res.status(error.status).json({
      error: error.message,
    });
  }

  return res.status(500).json({
    error: "Failed to calculate repository metrics",
  });
    }
  }
);

export default router;