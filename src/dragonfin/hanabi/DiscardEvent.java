package dragonfin.hanabi;

import java.io.*;
import com.fasterxml.jackson.core.*;

public class DiscardEvent extends HanabiEvent
{
	int actor;
	HanabiGame.Seat actorSeat;
	int slotDiscarded;
	HanabiGame.Card discardCard;
	HanabiGame.Card newCard;

	DiscardEvent()
	{
	}

	@Override
	public void writeJsonFor(JsonGenerator out, HanabiUser user)
		throws IOException
	{
		out.writeStartObject();
		out.writeStringField("event", "discard");
		out.writeStringField("actor", Integer.toString(actor));
		out.writeNumberField("handSlot", slotDiscarded);
		out.writeStringField("discardCard", discardCard.toString());
		if (newCard != null) {
			if (actorSeat.user == user) {
				// hide replacement card for the actor himself
				out.writeStringField("newCard", "unknown");
			}
			else {
				out.writeStringField("newCard", newCard.toString());
			}
		}
		out.writeStringField("message", actorSeat.user.name + " has discarded "
				+ discardCard);
		out.writeEndObject();
	}
}
