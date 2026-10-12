'use server'

import { db } from "@/db"
import { applications } from '@/db/schema';
import { requireOrganizer } from "@/lib/auth";

export async function fetchAppsList() {
    await requireOrganizer();
    const appsList = await db.select().from(applications);
    return appsList;
} 
