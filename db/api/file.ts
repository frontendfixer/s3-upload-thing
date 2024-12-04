import 'server-only';

import prisma from "../prisma";

export async function getFileInfo(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
  selectedFileTypes: string[],
  fileName?: string,
) {
  const offset = (page - 1) * pageSize;

  let whereClause: any = {
    userId: userId,
  };

  if (selectedFileTypes.length > 0) {
    const typeConditions: any[] = [];
    selectedFileTypes.forEach((type) => {
      switch (type) {
        case 'images':
          typeConditions.push({
            mimeType: {
              startsWith: 'image/',
            },
          });
          break;
        case 'videos':
          typeConditions.push({
            mimeType: {
              startsWith: 'video/',
            },
          });
          break;
        case 'pdf':
          typeConditions.push({
            mimeType: 'application/pdf',
          });
          break;
        case 'other':
          typeConditions.push({
            NOT: [
              { mimeType: { startsWith: 'image/' } },
              { mimeType: { startsWith: 'video/' } },
              { mimeType: 'application/pdf' },
            ],
          });
          break;
        default:
          typeConditions.push({ mimeType: null });
      }
    });

    whereClause = {
      AND: [
        whereClause,
        { OR: typeConditions },
      ],
    };
  }
    
  // Add fileName filter
  if (fileName && fileName.trim() !== '') {
    whereClause = {
      AND: [
        whereClause,
        {
          filename: {
            contains: fileName,
            mode: 'insensitive',
          },
        },
      ],
    };
  }

  const result = await prisma.files.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc',
    },
    skip: offset,
    take: pageSize,
    select: {
      s3Key: true,
      filename: true,
      mimeType: true,
      size: true,
    },
  });

  const totalCountResult = await prisma.files.count({
    where: whereClause,
  });

  const fileInfo=result.map((row) => ({
    s3Key: row.s3Key,
    filename: row.filename,
    contentType: row.mimeType,
    size: row.size,
  }));

  return {
    fileInfo,
    totalPages: Math.ceil(totalCountResult / pageSize),
    currentPage: page,
  };
}

export async function insertFileRecords(
  userId: string,
  filesData: Array<{
    name: string;
    size: number;
    key: string;
    type: string;
  }>,
) {
  const newFiles = await prisma.files.createMany({
    data: filesData.map((fileData, index) => ({
      userId,
      filename: fileData.name,
      mimeType: fileData.type,
      size: fileData.size,
      s3Key: fileData.key,
      createdAt: new Date(new Date().getTime() + index), // Add index to ensure unique timestamps
    })),
  });

  return newFiles;
}

export async function deleteFileRecord(userId: string, s3Key: string) {
  try {
    const result = await prisma.files.deleteMany({
      where: {
        userId: userId,
        s3Key: s3Key,
      },
    });

    if (result.count === 0) {
      throw new Error(
        "File not found or user not authorized to delete this file",
      );
    }

    return s3Key;
  } catch (error) {
    console.error("Error deleting file record:", error);
    throw error;
  }
}

export async function checkUserFileAccess(userId: string, s3Key: string): Promise<boolean> {
  const file = await prisma.files.findFirst({
    where: {
      userId: userId,
      s3Key: s3Key,
    },
  });

  return file !== null;
}
