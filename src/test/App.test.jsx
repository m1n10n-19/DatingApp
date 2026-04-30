import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders the landing page initially', () => {
    render(<App />);
    expect(screen.getByText('Complement')).toBeInTheDocument();
    expect(screen.getByText('Begin Analysis')).toBeInTheDocument();
  });

  it('navigates to Person A form when Begin Analysis is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Begin Analysis'));
    expect(screen.getByText('Person 1')).toBeInTheDocument();
    expect(screen.getByText("Let's start with the basics.")).toBeInTheDocument();
  });

  it('navigates back to landing from Person A form', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Begin Analysis'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Complement')).toBeInTheDocument();
  });
});
