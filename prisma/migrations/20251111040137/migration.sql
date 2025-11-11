/*
  Warnings:

  - You are about to drop the column `authorId` on the `Node` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Node` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Tree` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `Node` table without a default value. This is not possible if the table is not empty.

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" INTEGER NOT NULL,
    CONSTRAINT "Node_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Node_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Node" ("createdAt", "id", "operation", "parentId", "rightOperand", "treeId", "updatedAt", "value") SELECT "createdAt", "id", "operation", "parentId", "rightOperand", "treeId", "updatedAt", "value" FROM "Node";
DROP TABLE "Node";
ALTER TABLE "new_Node" RENAME TO "Node";
CREATE TABLE "new_Tree" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tree_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tree" ("createdAt", "createdBy", "id", "title", "updatedAt") SELECT "createdAt", "createdBy", "id", "title", "updatedAt" FROM "Tree";
DROP TABLE "Tree";
ALTER TABLE "new_Tree" RENAME TO "Tree";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
