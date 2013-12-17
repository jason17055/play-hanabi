package dragonfin.hanabi;

import java.io.*;
import com.fasterxml.jackson.core.*;

public class PlayCardEvent extends HanabiEvent
{
	int actor;
	HanabiGame.Seat actorSeat;
	int handSlot;
	HanabiGame.Card playCard;
	HanabiGame.Card newCard;

	PlayCardEvent()
	{
	}

	@Override
	public void writeJsonFor(JsonGenerator out, HanabiUser user)
		throws IOException
	{
		out.writeStartObject();
		out.writeStringField("event", "play_card");
		out.writeStringField("actor", Integer.toString(actor));
		out.writeNumberField("handSlot", handSlot);
		out.writeStringField("playCard", playCard.toString());
		out.writeStringField("suit", playCard.getSuitName());
		if (newCard != null) {
			if (actorSeat.user == user) {
				// hide replacement card for the actor himself
				out.writeStringField("newCard", "unknown");
			}
			else {
				out.writeStringField("newCard", newCard.toString());
			}
		}
		out.writeStringField("message", actorSeat.user.name + " has played "
				+ playCard);
		out.writeEndObject();
	}
}
