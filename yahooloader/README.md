# Yahoo Groups Archive Processor
An application designed to process Yahoo Groups archives and extract the data into a database for further analysis.

## Getting Started

### Prerequisites

A downloaded Yahoo Groups archive containing an email directory with the invididual emails in JSON files using the following tool: https://github.com/IgnoredAmbience/yahoo-group-archiver

### Setup

1. Create a Postgres database with the following table structure:
````
CREATE TABLE public.messages (
    internalmessageid integer NOT NULL,
    nummessagesintopic integer,
    nextintime integer,
    senderid character varying(256),
    systemmessage boolean,
    subject character varying(256),
    messagefrom character varying(256),
    authorname character varying(256),
    msgsnippet character varying(10485759),
    msgid integer,
    rawemail character varying(10485759),
    profile character varying(256),
    userid bigint,
    previntime integer,
    contenttrasformed boolean,
    postdate character varying(256),
    nextintopic integer,
    previntopic integer,
    topicid integer
);

ALTER TABLE public.messages OWNER TO postgres;
CREATE SEQUENCE public.messages_internalmessageid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.messages_internalmessageid_seq OWNER TO postgres;

ALTER SEQUENCE public.messages_internalmessageid_seq OWNED BY public.messages.internalmessageid;

ALTER TABLE ONLY public.messages ALTER COLUMN internalmessageid SET DEFAULT nextval('public.messages_internalmessageid_seq'::regclass);

ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (internalmessageid);



CREATE TABLE public.topics (
    internaltopicid integer NOT NULL,
    topicid integer NOT NULL,
    subject character varying
);


ALTER TABLE public.topics OWNER TO postgres;

CREATE SEQUENCE public.topics_internaltopicid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.topics_internaltopicid_seq OWNER TO postgres;

ALTER SEQUENCE public.topics_internaltopicid_seq OWNED BY public.topics.internaltopicid;

ALTER TABLE ONLY public.topics ALTER COLUMN internaltopicid SET DEFAULT nextval('public.topics_internaltopicid_seq'::regclass);
````

1. Update the values for the directory path and Postgres connection in the main JS file
1. Hope.