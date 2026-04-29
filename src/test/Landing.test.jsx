import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Landing from '../components/Landing';

describe('Landing', () => {
  it('renders the app title', () => {
    render(<Landing onStart={() => {}} />);
    expect(screen.getByText('Complement')).toBeInTheDocument();
  });

  it('renders the tagline', () => {
    render(<Landing onStart={() => {}} />);
    expect(screen.getByText('Know who completes you.')).toBeInTheDocument();
  });

  it('renders the Begin Analysis button', () => {
    render(<Landing onStart={() => {}} />);
    expect(screen.getByText('Begin Analysis')).toBeInTheDocument();
  });

  it('calls onStart when button is clicked', () => {
    const onStart = vi.fn();
    render(<Landing onStart={onStart} />);
    fireEvent.click(screen.getByText('Begin Analysis'));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
