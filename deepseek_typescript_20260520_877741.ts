import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const supabase = createRouteHandlerClient({ cookies })

    // 1. Cari data pendaftaran untuk mendapatkan subdomain/school_id
    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select('id, subdomain') // sesuaikan nama kolom subdomain
      .eq('id', id)
      .single()

    if (fetchError || !registration) {
      return NextResponse.json(
        { error: 'Data pendaftaran tidak ditemukan' },
        { status: 404 }
      )
    }

    // 2. Hapus data terkait di tabel schools (jika ada berdasarkan registration_id)
    const { error: deleteSchoolsError } = await supabase
      .from('schools')
      .delete()
      .eq('registration_id', id) // sesuaikan foreign key

    if (deleteSchoolsError && deleteSchoolsError.code !== 'PGRST116') {
      console.error('Gagal hapus schools:', deleteSchoolsError)
    }

    // 3. Hapus data pendaftaran utama
    const { error: deleteRegError } = await supabase
      .from('registrations')
      .delete()
      .eq('id', id)

    if (deleteRegError) {
      return NextResponse.json(
        { error: 'Gagal menghapus pendaftaran: ' + deleteRegError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Berhasil dihapus' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}