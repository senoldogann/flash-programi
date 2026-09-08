import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows the primary creation actions in Turkish', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /fotoğraf seç/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yazı ekle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /png indir/i })).toBeInTheDocument();
  });
});
