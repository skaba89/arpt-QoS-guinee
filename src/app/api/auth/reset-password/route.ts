import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission, logAudit } from "@/lib/rbac";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { checkRateLimit, stripHtml } from "@/lib/utils-api";

const resetPasswordSchema = z.object({
  userId: z.string().max(50).transform(stripHtml),
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Mot de passe trop long")
    .transform(stripHtml),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/auth/reset-password
// Admin-only: Reset a user's password
// Body: { userId, newPassword }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function POST(request: Request) {
  try {
    // SECURITY: Rate limiting on password reset — 5 requests per 5 minutes per IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`reset-password:${ip}`, 5, 300000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Limite de réinitialisation atteinte. Réessayez dans ${rl.resetIn}s.` },
        { status: 429, headers: { "Retry-After": String(rl.resetIn) } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const currentUserId = (session.user as Record<string, unknown>).id as string;

    const canAdmin = await checkPermission(userRole, "user", "admin");
    if (!canAdmin) {
      return NextResponse.json(
        { error: "Permissions insuffisantes — user:admin requis" },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    const parsed = resetPasswordSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId, newPassword } = parsed.data;

    // Verify target user exists
    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Prevent self-password-reset through this endpoint (use change-password instead)
    if (userId === currentUserId) {
      return NextResponse.json(
        { error: "Utilisez le changement de mot de passe pour votre propre compte" },
        { status: 400 }
      );
    }

    // Hash and update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await logAudit(
      currentUserId,
      "UPDATE",
      "user",
      `Reset mot de passe pour utilisateur ${targetUser.email}`,
      userId,
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({
      message: `Mot de passe réinitialisé avec succès pour ${targetUser.email}`,
      userId: targetUser.id,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
