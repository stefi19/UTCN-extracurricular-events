import type { NextApiRequest, NextApiResponse } from "next";

import { getServerAuthSession } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerAuthSession({ req, res });
  res.status(200).json(session);
}
