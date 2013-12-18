package dragonfin.hanabi;

import java.io.*;
import com.fasterxml.jackson.core.*;

public class HintEvent extends HanabiEvent
{
	int actor;
	HanabiGame.Seat actorSeat;
	int target;
	HanabiGame.HintType hintType;
	String hint;

	HintEvent()
	{
	}

	@Override
	public void writeJsonFor(JsonGenerator out, HanabiUser user)
		throws IOException
	{
		out.writeStartObject();
		out.writeStringField("event", "hint");
		out.writeStringField("actor", Integer.toString(actor));
		out.writeStringField("hintType", hintType.name());
		out.writeStringField("hint", hint);
		out.writeStringField("message", actorSeat.user.name + " has given a hint");
		out.writeEndObject();
	}
}
