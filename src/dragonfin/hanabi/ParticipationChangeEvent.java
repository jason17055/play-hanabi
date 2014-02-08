package dragonfin.hanabi;

import java.io.*;
import com.fasterxml.jackson.core.*;

public class ParticipationChangeEvent extends HanabiEvent
{
	String message;

	ParticipationChangeEvent()
	{
	}

	@Override
	public void writeJsonFor(JsonGenerator out, HanabiUser user)
		throws IOException
	{
		out.writeStartObject();
		out.writeStringField("event", "participation-change");
		out.writeStringField("message", message);
		out.writeEndObject();
	}
}
