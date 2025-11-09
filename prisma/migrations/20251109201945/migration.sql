/*
  Warnings:

  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Node` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Tree` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Node" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "treeId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "operation" TEXT NOT NULL,
    "rightOperand" REAL NOT NULL,
    "value" REAL NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER,
    CONSTRAINT "Node_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Node_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Node" ("authorId", "createdAt", "id", "operation", "parentId", "rightOperand", "treeId", "userId", "value") SELECT "authorId", "createdAt", "id", "operation", "parentId", "rightOperand", "treeId", "userId", "value" FROM "Node";
DROP TABLE "Node";
ALTER TABLE "new_Node" RENAME TO "Node";
CREATE TABLE "new_Tree" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER,
    CONSTRAINT "Tree_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tree" ("createdAt", "createdBy", "id", "title", "userId") SELECT "createdAt", "createdBy", "id", "title", "userId" FROM "Tree";
DROP TABLE "Tree";
ALTER TABLE "new_Tree" RENAME TO "Tree";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "id", "password") SELECT "createdAt", "id", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
