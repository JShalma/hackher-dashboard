'use server'

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, and } from 'drizzle-orm';

import { db } from "@/db";
import { applications } from '@/db/schema';
import { splitApplicationFormValues } from '@/lib/applications/map-form-to-db';
import { redirect } from "next/navigation";
import { requireOrganizer } from "@/lib/auth";

export async function getApplication() {
    const { userId } = await auth();

    if(!userId){
        throw new Error("You must be signed in to apply");
    }

    const [existingApplication] = await db.select().from(applications).where(eq(applications.clerkUserId, userId)).limit(1);

    if(existingApplication){
        return existingApplication;
    }
    
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;

    if (!email || !user) {
        throw new Error('A valid email address is required.');
    }

    if (!user.firstName || !user.lastName) {
        throw new Error('Your first and last name are required.');
    }

    const [newApplication] = await db.insert(applications).values({
        clerkUserId: userId,
        email,
        firstName: user.firstName,
        lastName: user.lastName,
    }).onConflictDoNothing({
        target: applications.clerkUserId
    })
    .returning();

    if(newApplication){
        return newApplication;
    }

    const [concurrentApplication] = await db.select().from(applications).where(eq(applications.clerkUserId, userId)).limit(1);
    if(!concurrentApplication){
        throw new Error("Unable to create or retrieve your application");
    }
    return concurrentApplication;
}

export async function getApplicationById(applicationId: string) {
    await requireOrganizer()
    const [ currentApp ] = await db.select().from(applications).where(eq(applications.id,applicationId )).limit(1);
    if(!currentApp){
        throw new Error("Unable to create or retrieve application");
    }
    return currentApp;
  
}

export async function submitApplication(values: Record<string, unknown>) {
    const { core, customFields } = splitApplicationFormValues(values);

    const { userId } = await auth();

    if(!userId){
        throw new Error("You must be signed in to apply");
    }

    const [ existingApplication ] = await db.select().from(applications).where(eq(applications.clerkUserId, userId)).limit(1);
    

    await db
    .update(applications)
    .set({
      ...core,
      customFields,
      status: "submitted",
      updatedAt: new Date(), 
    })
    .where(
      and(
        eq(applications.clerkUserId, existingApplication.clerkUserId),
        eq(applications.id, existingApplication.id),
      ),
    );

    redirect("/apply/status");

}
