import { isAuthenticated } from '@/lib/middleware';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

/**
 * PUT /api/admin/teachers/[id]
 * Update a teacher
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { name } = await request.json();
    const id = parseInt(params.id);
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      UPDATE teachers
      SET name = ${name},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating teacher:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Teacher with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update teacher' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/teachers/[id]
 * Delete a teacher
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const id = parseInt(params.id);
    
    const result = await sql`
      DELETE FROM teachers
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting teacher:', error);
    if (error.code === '23503') { // Foreign key constraint
      return NextResponse.json(
        { error: 'Cannot delete teacher: they are assigned to a semester' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete teacher' },
      { status: 500 }
    );
  }
}

