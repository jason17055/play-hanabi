package dragonfin.hanabi;

import java.util.*;

public class HanabiGame
{
	List<Seat> seats = new ArrayList<Seat>();
	List<Card> drawPile = new ArrayList<Card>();
	final static Random R = new Random();

	public void addPlayer(HanabiUser u)
	{
		Seat seat = new Seat();
		seat.user = u;
		seats.add(seat);
	}

	public void startGame()
	{
		drawPile.clear();
		for (int i = 0; i < 50; i++) {
			drawPile.add(new Card(i));
		}
		shuffle();

		for (Seat s : seats) {
			for (int i = 0; i < s.hand.length; i++) {
				s.hand[i] = drawCard();
			}
		}
	}

	Card drawCard()
	{
		return drawPile.remove(drawPile.size()-1);
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

	class Seat
	{
		HanabiUser user;
		Card [] hand = new Card[4];
	}

	class Card
	{
		int id;
		Card(int id)
		{
			this.id = id;
		}

		@Override
		public boolean equals(Object obj)
		{
			return obj instanceof Card && ((Card)obj).id==this.id;
		}

		@Override
		public String toString()
		{
			return getSuitName()+"-"+getRank();
		}

		String getSuitName()
		{
			return SUIT_NAMES[id/10];
		}

		int getRank()
		{
			int j = id % 10;
			return j < 3 ? 1 :
				j < 5 ? 2 :
				j < 7 ? 3 :
				j < 9 ? 4 :
				5;
		}
	}

	static final String [] SUIT_NAMES = {
		"red", "green", "white", "blue", "yellow"
		};
}
