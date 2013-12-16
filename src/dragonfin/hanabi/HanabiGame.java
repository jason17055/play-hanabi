package dragonfin.hanabi;

import java.util.*;

public class HanabiGame
{
	List<Seat> seats = new ArrayList<Seat>();
	List<Card> drawPile = new ArrayList<Card>();
	List<Card> discards = new ArrayList<Card>();
	int hintsLeft;
	int errorsMade;
	int [] piles = new int[SUIT_COUNT];
	List<Hint> hints = new ArrayList<Hint>();
	int turn;
	int activeSeat;

	final static Random R = new Random();
	static final int MAX_HINTS = 8;
	static final int CARDS_PER_PLAYER = 4;

	public void addPlayer(HanabiUser u)
	{
		Seat seat = new Seat();
		seat.user = u;
		seats.add(seat);
	}

	Seat getActiveSeat()
	{
		return seats.get(activeSeat);
	}

	public void giveHint(String target, String hint)
	{
		int seatNumber = Integer.parseInt(target);
		hintsLeft--;

		Hint h = new Hint();
		h.from = activeSeat;
		h.to = seatNumber;
		h.whenGiven = turn;

		if (hint.matches("^(\\d+)$")) {
			int rank = Integer.parseInt(hint);
			h.type = HintType.RANK;
			h.hintData = rank;
		}
		else {
			h.type = HintType.SUIT;
			for (int i = 0; i < SUIT_NAMES.length; i++) {
				if (hint.equals(SUIT_NAMES[i])) {
					h.hintData = i;
					break;
				}
			}
		}

		hints.add(h);

		nextTurn();
	}

	static class PlayCardResult
	{
		boolean success;
		Card card;
	}

	public Card discardCard(int slot)
	{
		Seat seat = getActiveSeat();
		Card c = seat.detachCard(slot);
		discards.add(c);

		// replace the selected card
		seat.addCard(drawCard(), turn+1);

		// adjust available hints
		hintsLeft = Math.min(hintsLeft+1, MAX_HINTS);

		nextTurn();
		return c;
	}

	public PlayCardResult playCard(int slot)
	{
		PlayCardResult rv = new PlayCardResult();

		Seat seat = getActiveSeat();
		rv.card = seat.detachCard(slot);

		// check whether the card is playable
		int height = piles[rv.card.suit];
		if (rv.card.rank == height+1) {
			// success
			rv.success = true;
			piles[rv.card.suit] = rv.card.rank;
		}
		else {
			// failure
			rv.success = false;
			errorsMade++;
			discards.add(rv.card);
		}

		// replace the selected card
		seat.addCard(drawCard(), turn+1);

		nextTurn();
		return rv;
	}

	public void startGame()
	{
		hintsLeft = 8;
		errorsMade = 0;

		drawPile.clear();
		for (int i = 0; i < SUIT_COUNT; i++) {
			drawPile.add(new Card(i, 1));
			drawPile.add(new Card(i, 1));
			drawPile.add(new Card(i, 1));
			drawPile.add(new Card(i, 2));
			drawPile.add(new Card(i, 2));
			drawPile.add(new Card(i, 3));
			drawPile.add(new Card(i, 3));
			drawPile.add(new Card(i, 4));
			drawPile.add(new Card(i, 4));
			drawPile.add(new Card(i, 5));
		}
		shuffle();

		for (Seat s : seats) {
			for (int i = 0; i < CARDS_PER_PLAYER; i++) {
				s.addCard(drawCard(), 0);
			}
		}

		turn = 0;
		activeSeat = 0;
	}

	Card drawCard()
	{
		return drawPile.remove(drawPile.size()-1);
	}

	void nextTurn()
	{
		turn++;
		activeSeat = (activeSeat+1) % seats.size();
	}

	void shuffle()
	{
		int len = drawPile.size();
		for (int i = 0; i < len; i++) {
			int j = i + R.nextInt(len-i);
			Card tmp = drawPile.get(i);
			drawPile.set(i, drawPile.get(j));
			drawPile.set(j, tmp);
		}
	}

	public Card getPileTopCard(int pileNumber)
	{
		assert pileNumber >= 0 && pileNumber < SUIT_COUNT;

		if (piles[pileNumber] != 0) {
			return new Card(pileNumber, piles[pileNumber]);
		}
		else {
			return null;
		}
	}

	class Seat
	{
		HanabiUser user;
		List<Card> hand = new ArrayList<Card>();
		List<Integer> whenReceived = new ArrayList<Integer>();

		void addCard(Card c, int when)
		{
			this.hand.add(c);
			this.whenReceived.add(when);
		}

		Card detachCard(int slot)
		{
			Card c = this.hand.remove(slot);
			this.whenReceived.remove(slot);
			return c;
		}
	}

	static class Card
	{
		int suit;
		int rank;
		Card(int suit, int rank)
		{
			this.suit = suit;
			this.rank = rank;
		}

		@Override
		public boolean equals(Object obj)
		{
			if (obj instanceof Card) {
				Card c = (Card)obj;
				return c.suit==this.suit && c.rank==this.rank;
			}
			return false;
		}

		@Override
		public String toString()
		{
			return getSuitName()+"-"+getRank();
		}

		String getSuitName()
		{
			return SUIT_NAMES[suit];
		}

		int getRank()
		{
			return rank;
		}
	}

	static final String [] SUIT_NAMES = {
		"red", "green", "white", "blue", "yellow"
		};
	static final int SUIT_COUNT = SUIT_NAMES.length;

	static enum HintType
	{
		SUIT,
		RANK;
	}

	static class Hint
	{
		int from;
		int to;
		int whenGiven;
		HintType type;
		int hintData;

		public String getHintString()
		{
			switch (type) {
			case SUIT:
				return SUIT_NAMES[hintData];
			case RANK:
				return Integer.toString(hintData);
			default:
				throw new Error("unexpected");
			}
		}

		public boolean affirms(Card c)
		{
			switch (type) {
			case SUIT:
				return c.suit == hintData;
			case RANK:
				return c.rank == hintData;
			default:
				throw new Error("unexpected");
			}
		}
	}
}
