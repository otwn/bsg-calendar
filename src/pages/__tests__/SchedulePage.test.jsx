import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockMembersOrder = vi.fn()
const mockMembersEq = vi.fn()
const mockShiftsEq = vi.fn()

vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'bsg_active_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: mockMembersEq,
          }),
        }
      }
      if (table === 'bsg_members') {
        // Should NOT be called for member fetching
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }
      }
      if (table === 'bsg_shifts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: mockShiftsEq,
          }),
        }
      }
      return { select: vi.fn() }
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn(),
        }),
      }),
    }),
  },
}))

import { supabase } from '../../supabase'

const MOCK_ACTIVE_MEMBERS = [
  { id: '1', name: 'Alice', color: '#6366f1' },
  { id: '2', name: 'Bob', color: '#ec4899' },
]

describe('SchedulePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMembersEq.mockReturnValue({ order: mockMembersOrder })
    mockMembersOrder.mockResolvedValue({ data: MOCK_ACTIVE_MEMBERS })
    mockShiftsEq.mockResolvedValue({ data: [] })
  })

  it('queries bsg_active_members view (not bsg_members table)', async () => {
    // Import dynamically so mocks apply
    const { default: SchedulePage } = await import('../SchedulePage')
    const { render, waitFor } = await import('@testing-library/react')
    const { MemoryRouter } = await import('react-router-dom')

    render(
      <MemoryRouter>
        <SchedulePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Verify bsg_active_members was called
      const fromCalls = supabase.from.mock.calls
      const activeMembersCalls = fromCalls.filter(c => c[0] === 'bsg_active_members')
      expect(activeMembersCalls.length).toBeGreaterThan(0)
    })
  })

  it('does not query bsg_members table directly for member list', async () => {
    const { default: SchedulePage } = await import('../SchedulePage')
    const { render, waitFor } = await import('@testing-library/react')
    const { MemoryRouter } = await import('react-router-dom')

    render(
      <MemoryRouter>
        <SchedulePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      const fromCalls = supabase.from.mock.calls
      // bsg_members table should never be queried directly for the member list
      const membersCalls = fromCalls.filter(c => c[0] === 'bsg_members')
      expect(membersCalls.length).toBe(0)
    })
  })

  it('filters members and shifts by the selected region', async () => {
    const { default: SchedulePage } = await import('../SchedulePage')
    const { render, waitFor } = await import('@testing-library/react')
    const { MemoryRouter } = await import('react-router-dom')

    render(
      <MemoryRouter>
        <SchedulePage selectedRegion="north_texas" />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(mockMembersEq).toHaveBeenCalledWith('region_name', 'north_texas')
      expect(mockShiftsEq).toHaveBeenCalledWith('region_name', 'north_texas')
    })
  })
})
