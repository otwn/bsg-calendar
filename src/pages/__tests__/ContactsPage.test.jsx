import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Separate mock chains for active_members vs members (removed)
const mockActiveOrder = vi.fn()
const mockActiveEq = vi.fn()
const mockRemovedOrder = vi.fn()
const mockRemovedNot = vi.fn()
const mockRemovedEq = vi.fn()
const mockUpdate = vi.fn()
const mockUpdateById = vi.fn()
const mockUpdateByRegion = vi.fn()
const mockInsert = vi.fn()
const mockMemberInsert = vi.fn()
const mockShiftMemberEq = vi.fn()
const mockShiftRegionEq = vi.fn()
const mockShiftGte = vi.fn()

vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'bsg_active_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: mockActiveEq,
          }),
        }
      }
      if (table === 'bsg_members') {
        return {
          select: vi.fn().mockReturnValue({
            not: mockRemovedNot,
          }),
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateById,
          }),
          insert: mockMemberInsert,
        }
      }
      if (table === 'bsg_shifts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: mockShiftMemberEq,
          }),
        }
      }
      if (table === 'bsg_history') {
        return {
          insert: mockInsert,
        }
      }
      return { select: vi.fn() }
    }),
  },
}))

import ContactsPage from '../ContactsPage'

const MOCK_MEMBERS = [
  { id: '1', name: 'Alice', email: 'alice@test.com', phone: '555-0101', color: '#6366f1' },
  { id: '2', name: 'Bob', email: 'bob@test.com', phone: '555-0102', color: '#ec4899' },
]

const MOCK_REMOVED = [
  { id: '3', name: 'Carol', email: 'carol@test.com', phone: '555-0103', color: '#14b8a6', deleted_at: '2026-01-01T00:00:00Z' },
]

describe('ContactsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockActiveEq.mockReturnValue({ order: mockActiveOrder })
    mockActiveOrder.mockResolvedValue({ data: MOCK_MEMBERS })
    mockRemovedNot.mockReturnValue({ eq: mockRemovedEq })
    mockRemovedEq.mockReturnValue({ order: mockRemovedOrder })
    mockRemovedOrder.mockResolvedValue({ data: [] })
    mockUpdateById.mockReturnValue({ eq: mockUpdateByRegion })
    mockUpdateByRegion.mockResolvedValue({ data: null })
    mockShiftMemberEq.mockReturnValue({ eq: mockShiftRegionEq })
    mockShiftRegionEq.mockReturnValue({ gte: mockShiftGte })
  })

  it('renders active members by default', async () => {
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })
  })

  it('soft delete sets deleted_at (not hard delete)', async () => {
    mockShiftGte.mockResolvedValue({ data: [], count: 0 })
    mockInsert.mockResolvedValue({ data: null })

    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByLabelText(/remove/i)
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Remove Alice\?/)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^Remove$/i }))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  it('shows confirmation modal with shift count', async () => {
    mockShiftGte.mockResolvedValue({ data: [{ id: 's1' }, { id: 's2' }], count: 2 })

    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByLabelText(/remove/i)
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/2 upcoming shift/)).toBeInTheDocument()
    })
  })

  it('toast appears after delete with undo button', async () => {
    mockShiftGte.mockResolvedValue({ data: [], count: 0 })
    mockInsert.mockResolvedValue({ data: null })

    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByLabelText(/remove/i)
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Remove Alice\?/)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^Remove$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Alice removed from team/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
    })
  })

  it('undo restores member (clears deleted_at)', async () => {
    mockShiftGte.mockResolvedValue({ data: [], count: 0 })
    mockInsert.mockResolvedValue({ data: null })

    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByLabelText(/remove/i)
    await user.click(deleteButtons[0])
    await waitFor(() => {
      expect(screen.getByText(/Remove Alice\?/)).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /^Remove$/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /undo/i }))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledTimes(2)
    })
  })

  it('tab switch shows removed members', async () => {
    mockRemovedOrder.mockResolvedValue({ data: MOCK_REMOVED })

    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const removedTab = screen.getByRole('button', { name: /removed/i })
    await user.click(removedTab)

    await waitFor(() => {
      expect(screen.getByText('Carol')).toBeInTheDocument()
    })
  })

  it('saves the selected group_tag when adding a member', async () => {
    mockMemberInsert.mockResolvedValue({ data: null })

    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    // Only the header "Add Member" button exists before the modal opens
    await user.click(screen.getByRole('button', { name: /add member/i }))

    await user.type(screen.getByPlaceholderText('John Doe'), 'Koichi Onogi')
    await user.selectOptions(screen.getByRole('combobox'), 's/g')

    // After opening, both the header and modal save buttons read "Add Member"
    const addButtons = screen.getAllByRole('button', { name: /add member/i })
    await user.click(addButtons[addButtons.length - 1])

    await waitFor(() => {
      expect(mockMemberInsert).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Koichi Onogi', group_tag: 's/g', region_name: 'central_texas' })
      )
    })
  })

  it('filters member queries by the selected region', async () => {
    render(<ContactsPage selectedRegion="north_texas" />)

    await waitFor(() => {
      expect(mockActiveEq).toHaveBeenCalledWith('region_name', 'north_texas')
      expect(mockRemovedEq).toHaveBeenCalledWith('region_name', 'north_texas')
    })
  })
})
