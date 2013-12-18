package dragonfin.hanabi;

import java.io.*;
import com.fasterxml.jackson.core.*;

public class NewCardEvent extends HanabiEvent
{
	int target;
	HanabiGame.Seat targetSeat;
	HanabiGame.Card newCard;
	int handSlot;

	NewCardEvent()
	{
	}

	@Override
	public void writeJsonFor(JsonGenerator out, HanabiUser user)
		throws IOException
	{
		out.writeStartObject();
		out.writeStringField("event", "new_card");
		out.writeStringField("target", Integer.toString(target));
		out.writeNumberField("handSlot", handSlot);

		if (targetSeat.user == user) {
			// hide replacement card for the actor himself
			out.writeStringField("newCard", "unknown");
		}
		else {
			out.writeStringField("newCard", newCard.toString());
		}

		out.writeStringField("message", targetSeat.user.name + " has received a card");
		out.writeEndObject();
	}
}
