package dragonfin.hanabi;

import java.io.*;
import com.fasterxml.jackson.core.*;

public class NextTurnEvent extends HanabiEvent
{
	int turn;
	int activeSeat;

	NextTurnEvent(int turn, int activeSeat)
	{
		this.turn = turn;
		this.activeSeat = activeSeat;
	}

	@Override
	public void writeJsonFor(JsonGenerator out, HanabiUser user)
		throws IOException
	{
		out.writeStartObject();
		out.writeStringField("event", "next_turn");
		out.writeNumberField("turn", turn);
		out.writeStringField("activeSeat", Integer.toString(activeSeat));
		out.writeEndObject();
	}
}
