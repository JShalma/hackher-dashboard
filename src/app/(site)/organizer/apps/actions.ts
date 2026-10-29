"use server";

import { db } from "@/db"
import { eq } from 'drizzle-orm';
import { applications } from '@/db/schema';
import   {applicationStatusEnum} from '@/db/schema';
import { requireOrganizer } from "@/lib/auth";

/**
 * Organizer list read. Status update / Accept-Deny actions must also call
 * `requireOrganizer()` and enforce transition rules (task 31/37) — do not
 * add applicant-callable writes here.
 */
export async function fetchAppsList() {
    await requireOrganizer();
    return await db.select().from(applications);;
} 

export type Status = (typeof applicationStatusEnum.enumValues)[number];

export async function updateApplicationStatus(status: Status, userId: string){
    const admin = await requireOrganizer();
    await db
    .update(applications)
    .set({
        statusUpdatedBy: admin.userId,
        status: status,
        statusUpdatedAt: new Date(), 
    })
    .where(
        eq(applications.clerkUserId, userId),
    );
}

export async function flagApplication(userId: string){
    const admin = await requireOrganizer();
    await db
    .update(applications)
    .set({
        flaggedBy: applications.flagged ? null : admin.userId,
        flaggedAt: applications.flagged ? null : new Date(), 
        flagged: !(applications.flagged),
    })
    .where(
        eq(applications.clerkUserId, userId),
    );
}